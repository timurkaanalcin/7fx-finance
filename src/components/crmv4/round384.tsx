"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  SCG_DENSITY_KEY,
  SCG_KEY,
  SCG_PIGMENTS,
  SCG_VIEW_KEY,
  VEN_HIDE_KEY,
  VEN_REVIEW_KEY,
  addSlab,
  addSlabTag,
  addSlabView,
  briskSlab,
  bulkSlabIvory,
  bulkSlabLift,
  bulkSlabVault,
  bulkSlabTag,
  bulkVenReview,
  busiestHand,
  dropSlabView,
  editSlab,
  editSlabNote,
  fairHand,
  groundFocused,
  idleSlab,
  graphiteQuiet,
  laneVenCount,
  lateSlab,
  leadingVen,
  leadingVenHue,
  lowerFilmFocused,
  lowerDayFocused,
  moveSlabFocus,
  overdueSlab,
  presentVenLanes,
  raiseFilmFocused,
  raiseDayFocused,
  readHiddenVen,
  readReviewedVen,
  readSlabViews,
  readSlabs,
  reminderSlabs,
  restingSlab,
  setSlabFocused,
  setSlabGround,
  setSlabRaised,
  setSlabStar,
  setSlabVault,
  setSlabRack,
  slabBars,
  slabCopy,
  slabCounts,
  slabCsv,
  slabDensity,
  slabHands,
  slabTimeline,
  venCool,
  venCopy,
  venDigit,
  venEven,
  venFamily,
  venKeep,
  venFirst,
  venLost,
  venHeld,
  venHue,
  venHush,
  venLane,
  venLanes,
  venLanesCsv,
  venLength,
  venLetter,
  venLongLane,
  venLower,
  venMixed,
  venOpen,
  venBare,
  venRoute,
  venRowsCsv,
  venShare,
  venShort,
  venSpace,
  venStamp,
  venTail,
  venTallyLane,
  venPair,
  venUpper,
  venVowel,
  venVowelLane,
  venSoon,
  sortSlabs,
  pinSlabFocused,
  suggestSlabDay,
  suggestSlabGround,
  suggestSpatula,
  toggleVen,
  toggleVenReview,
  spatulaCool,
  visibleVenLanes,
  spatulaWarm,
  rackSlabFocused,
  visibleSlabs,
  visibleVen,
  type Slab,
  type SlabDensity,
  type SlabSort,
  type SlabRack,
  type SlabView,
  type VenReview,
  type VenRow,
  type VenShape,
  type VenValue,
} from "@/lib/crmv4/round384";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const GROUNDS = ["IVORY", "GRAPHITE", "CHAMPAGNE"] as const;
const DAYS = ["5", "7", "11", "18"] as const;
const FILMS = ["1", "3", "7"] as const;

const TOOL_KEY: Record<string, CrmV4CopyKey> = {
  spatula: "scgOchre",
  float: "scgVine",
  comb: "scgBone",
  burnish: "scgLamp",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "scgAuditSave",
  edit: "scgAuditEdit",
  note: "scgAuditNote",
  ground: "scgAuditGround",
  raise: "scgAuditRaise",
  free: "scgAuditFree",
  tray: "scgAuditTray",
  return: "scgAuditReturn",
  store: "scgAuditStore",
  open: "scgAuditOpen",
  tag: "scgAuditTag",
  coat: "scgAuditCoat",
  depth: "scgAuditDepth",
  lower: "scgAuditLower",
  star: "scgAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  firm: "venLaneFirm",
  hush: "venLaneHush",
  wait: "venLaneWait",
  bench: "venLaneBench",
  gone: "venLaneGone",
  twin: "venLaneTwin",
  route: "venLaneRoute",
  short: "venLaneShort",
  long: "venLaneLong",
  tally: "venLaneTally",
  vowel: "venLaneVowel",
  plain: "venLanePlain",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  gilt: "venGilt",
  pearl: "venPearl",
  ink: "venInk",
};

const SHAPE_KEY: Record<VenShape, CrmV4CopyKey> = {
  all: "venShapeAll",
  firm: "venShapeFirm",
  hush: "venShapeHush",
  wait: "venShapeWait",
  gone: "venShapeGone",
  bench: "venShapeBench",
  twin: "venShapeTwin",
  route: "venShapeRoute",
  short: "venShapeShort",
  long: "venShapeLong",
  tally: "venShapeTally",
  vowel: "venShapeVowel",
  plain: "venShapePlain",
  open: "venShapeOpen",
  soon: "venShapeSoon",
  letter: "venShapeLetter",
  mixed: "venShapeDigit",
  upper: "venShapeUpper",
  lower: "venShapePlain",
  space: "venShapeSpace",
  even: "venShapeEven",
  odd: "venShapeEven",
  tail: "venShapeTally",
  first: "venShapePlain",
  held: "venShapeLong",
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

function toolLabel(v4: V4, tool: string): string {
  const key = TOOL_KEY[tool];
  return key ? v4(key) : v4("scgBlankTool");
}

function groundLabel(v4: V4, ground: string): string {
  if (ground === "IVORY") return v4("scgIvory");
  if (ground === "GRAPHITE") return v4("scgGraphite");
  if (ground === "CHAMPAGNE") return v4("scgChampagne");
  return v4("scgAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("venBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("venBlank");
}

export function ScagliolaSlabs({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Slab[]>([]);
  const [views, setViews] = useState<SlabView[]>([]);
  const [density, setDensity] = useState<SlabDensity>("open");
  const [tray, setTray] = useState<SlabRack>("wall");
  const [query, setQuery] = useState("");
  const [handFilter, setHandFilter] = useState("");
  const [groundFilter, setGroundFilter] = useState("all");
  const [toolFilter, setToolFilter] = useState("all");
  const [depthFilter, setDepthFilter] = useState("all");
  const [coatFilter, setCoatFilter] = useState("all");
  const [sort, setSort] = useState<SlabSort>("tool");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [hand, setHand] = useState("");
  const [tool, setTool] = useState("");
  const [ground, setGround] = useState("");
  const [depthNo, setDepthNo] = useState("");
  const [coatNo, setCoatNo] = useState("");
  const [tags, setTags] = useState("");
  const [viewName, setViewName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focusAt, setFocusAt] = useState(0);
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteId, setNoteId] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [station, setStation] = useState("spatula");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readSlabs(readJson(SCG_KEY, [])));
    setViews(readSlabViews(readJson(SCG_VIEW_KEY, [])));
    setDensity(slabDensity(readJson(SCG_DENSITY_KEY, "open")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Slab[]) {
    setCards(next);
    writeJson(SCG_KEY, next);
  }
  function storeViews(next: SlabView[]) {
    setViews(next);
    writeJson(SCG_VIEW_KEY, next);
  }
  function storeDensity(next: SlabDensity) {
    setDensity(next);
    writeJson(SCG_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortSlabs(visibleSlabs(cards, tray, query, handFilter, groundFilter, toolFilter, depthFilter, coatFilter), sort),
    [cards, tray, query, handFilter, groundFilter, toolFilter, depthFilter, coatFilter, sort],
  );
  const counts = slabCounts(cards, shown, station);
  const bars = slabBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = slabTimeline(cards);
  const reminders = reminderSlabs(cards);
  const hands = slabHands(cards);
  const busy = busiestHand(cards);
  const fair = fairHand(cards, hands.join(","));
  const suggestedGround = suggestSlabGround(cards);
  const suggestedDepth = suggestSlabDay(cards, clock);
  const suggestedTool = suggestSpatula(clock);
  const focused = shown[Math.min(focusAt, Math.max(0, shown.length - 1))];

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "/" && !typingTarget(event)) {
        event.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (typingTarget(event) || viewer) return;
      if (event.key === "c" || event.key === "C") {
        event.preventDefault();
        titleRef.current?.focus();
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("scagliola.csv", slabCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveSlabFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveSlabFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addSlab(cards, { title, note, hand, tool, depth: depthNo, ground, coat: coatNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-scagliola" aria-label={v4("scgTitle")} data-slabs="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-scagliola-mast">
        <p className="c4-scagliola-seal" data-logo="mono">{v4("scgLogo")}</p>
        <div>
          <p className="c4-scagliola-kicker">{v4("scgSub")}</p>
          <h2 className="c4-title">{v4("scgTitle")}</h2>
        </div>
        <p className="c4-scagliola-count">{shown.length}</p>
      </header>
      <p className="c4-scagliola-links">
        <Link href={crmv4Href(base, "ven")}>{v4("venTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("scgCustomers")}</Link>
      </p>
      <p className="c4-scagliola-hint">{v4("scgHint")}</p>
      {viewer && <p className="c4-scagliola-note">{v4("scgViewer")}</p>}
      <p className="c4-scagliola-meta">{v4("scgFair")} {fair || "—"} · {v4("scgBusy")} {busy || "—"} · {v4("scgSuggest")} {toolLabel(v4, suggestedTool)} · {groundLabel(v4, suggestedGround)} · {suggestedDepth}</p>
      <ol className="c4-scagliola-index" aria-label={v4("scgRemind")}>
        <li data-tone="gold">{v4("scgOverdue")} {counts.overdue}</li>
        <li data-tone="ink">{v4("scgIdle")} {counts.idle}</li>
        <li data-tone="pearl">{v4("scgBrisk")} {counts.brisk}</li>
        <li data-tone="pearl">{v4("scgResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-scagliola-remind c4-scagliola-notices" role="status" aria-label={v4("scgRemind")}>
          {reminders.map((name) => <li key={name}>{v4("scgOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-scagliola-chart" aria-label={v4("scgChart")}>
        {bars.map((bar) => (
          <button key={bar.tool} type="button" className="c4-scagliola-column" data-on={toolFilter === bar.tool ? "1" : "0"} onClick={() => setToolFilter(toolFilter === bar.tool ? "all" : bar.tool)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{toolLabel(v4, bar.tool)}</span>
          </button>
        ))}
      </div>
      <form className="c4-scagliola-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("scgEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("scgEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("scgNote")}<input className="c4-field" aria-label={v4("scgNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("scgHand")}<input className="c4-field" aria-label={v4("scgHand")} aria-required={false} value={hand} maxLength={24} disabled={viewer} onChange={(event) => setHand(event.target.value)} /></label>
        <label className="c4-lab">{v4("scgTool")}<select className="c4-field" aria-label={v4("scgTool")} value={tool} disabled={viewer} onChange={(event) => setTool(event.target.value)}><option value="">{v4("scgBlankTool")}</option>{SCG_PIGMENTS.map((item) => <option key={item} value={item}>{toolLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("scgGround")}<select className="c4-field" aria-label={v4("scgGround")} value={ground} disabled={viewer} onChange={(event) => setGround(event.target.value)}><option value="">{v4("scgAll")}</option>{GROUNDS.map((item) => <option key={item} value={item}>{groundLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("scgDepth")}<select className="c4-field" aria-label={v4("scgDepth")} value={depthNo} disabled={viewer} onChange={(event) => setDepthNo(event.target.value)}><option value="">{v4("scgAll")}</option>{DAYS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("scgCoat")}<select className="c4-field" aria-label={v4("scgCoat")} value={coatNo} disabled={viewer} onChange={(event) => setCoatNo(event.target.value)}><option value="">{v4("scgAll")}</option>{FILMS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("scgTag")}<input className="c4-field" aria-label={v4("scgTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("scgAdd")}</button>
      </form>
      <div className="c4-scagliola-tools">
        <input ref={searchRef} className="c4-field c4-scagliola-search" aria-label={v4("scgSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("scgSearch")} />
        {(["wall", "tray", "store"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "wall" ? "scgWall" : item === "tray" ? "scgTray" : "scgStore")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={toolFilter === "warm" ? "1" : "0"} onClick={() => setToolFilter(toolFilter === "warm" ? "all" : "warm")}>{v4("scgWarm")}</button>
        <button type="button" className="c4-chip" data-on={toolFilter === "cool" ? "1" : "0"} onClick={() => setToolFilter(toolFilter === "cool" ? "all" : "cool")}>{v4("scgCool")}</button>
        {GROUNDS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={groundFilter === item ? "1" : "0"} onClick={() => setGroundFilter(groundFilter === item ? "all" : item)}>{groundLabel(v4, item)}</button>
        ))}
        {DAYS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={depthFilter === item ? "1" : "0"} onClick={() => setDepthFilter(depthFilter === item ? "all" : item)}>{item}</button>
        ))}
        {FILMS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={coatFilter === item ? "1" : "0"} onClick={() => setCoatFilter(coatFilter === item ? "all" : item)}>{item}</button>
        ))}
        {hands.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={handFilter === name ? "1" : "0"} onClick={() => setHandFilter(handFilter === name ? "" : name)}>{name}</button>
        ))}
        <button type="button" className="c4-chip" data-on={sort === "hand" ? "1" : "0"} onClick={() => setSort(sort === "hand" ? "tool" : "hand")}>{sort === "hand" ? v4("scgSortHand") : v4("scgSortTool")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "open" : "tight")}>{density === "tight" ? v4("scgTight") : v4("scgOpen")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("scgTimeline")}</button>
        <label className="c4-lab">{v4("scgDesk")}<select className="c4-field" aria-label={v4("scgDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{SCG_PIGMENTS.map((item) => <option key={item} value={item}>{toolLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-scagliola-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addSlabView(views, { id, name: viewName, tray, query, hand: handFilter, ground: groundFilter, tool: toolFilter, depth: depthFilter, coat: coatFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("scgViewName")}<input className="c4-field" aria-label={v4("scgViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("scgSaveView")}</button>
      </form>
      <ul className="c4-scagliola-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setHandFilter(view.hand); setGroundFilter(view.ground); setToolFilter(view.tool); setDepthFilter(view.depth); setCoatFilter(view.coat); }}>{v4("scgApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropSlabView(views, view.id))}>{v4("scgDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-scagliola-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkSlabLift(cards, picked))}>{v4("scgBulkRaise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkSlabVault(cards, picked))}>{v4("scgBulkStore")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkSlabIvory(cards, picked))}>{v4("scgBulkIvory")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkSlabTag(cards, picked))}>{v4("scgBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("scagliola.csv", slabCsv(shown, station))}>{v4("scgCsv")}</button>
        <p className="c4-scagliola-meta">{v4("scgKeys")} / c x a j k · {v4("scgQuiet")} {counts.quiet} · {v4("scgWarm")} {counts.warm}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-scagliola-time" aria-label={v4("scgTimeline")}>
          {timeline.map((row) => <li key={row.depth}><span>{row.depth}</span> {row.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("scgEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-scagliola-list">
          {shown.map((card) => {
            const late = lateSlab(card, station);
            return (
              <li key={card.id} className="c4-scagliola-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleSlab(card) ? "1" : "0"} data-brisk={briskSlab(card) ? "1" : "0"} data-overdue={overdueSlab(card) ? "1" : "0"} data-resting={restingSlab(card) ? "1" : "0"} data-warm={spatulaWarm(card.tool) ? "1" : "0"} data-cool={spatulaCool(card.tool) ? "1" : "0"} data-quiet={graphiteQuiet(card.ground) ? "1" : "0"}>
                <label className="c4-scagliola-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editSlab(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("scgEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("scgApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editSlabNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("scgNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-scagliola-meta">{toolLabel(v4, card.tool)} · {groundLabel(v4, card.ground)} · {card.depth ?? "—"} · {card.coat} · {card.hand || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "scgAuditSave")}` : ""}{late ? ` · ${v4("scgOverdue")}` : ""}</p>
                </div>
                <div className="c4-scagliola-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("scgEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSlabRaised(cards, card.id, !card.raised))}>{card.raised ? v4("scgFree") : v4("scgRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSlabGround(cards, card.id, suggestedGround))}>{v4("scgSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSlabRack(cards, card.id, !card.trayed))}>{card.trayed ? v4("scgUntray") : v4("scgTrayIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSlabVault(cards, card.id, !card.stored))}>{card.stored ? v4("scgUnstore") : v4("scgStoreIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSlabStar(cards, card.id, !card.starred))}>{card.starred ? v4("scgUnstar") : v4("scgStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addSlabTag(cards, card.id, "s"))}>{v4("scgTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseDayFocused(cards, card.id))}>{v4("scgRaiseDepth")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerDayFocused(cards, card.id))}>{v4("scgLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseFilmFocused(cards, card.id))}>{v4("scgCoat")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerFilmFocused(cards, card.id))}>{v4("scgCoat")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(groundFocused(cards, card.id))}>{v4("scgGround")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSlabFocused(cards, card.id))}>{v4("scgRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(rackSlabFocused(cards, card.id))}>{v4("scgTray")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinSlabFocused(cards, card.id))}>{v4("scgStar")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(slabCopy(card))}>{v4("scgCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type CapUser = { id?: string; name?: string | null; saleStatus?: string | null };

export function VeinCombs({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: CapUser[] }>("/api/admin/users?take=24&meta=0");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<VenShape>("all");
  const [review, setReview] = useState<VenReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): VenRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      userId: id,
      code: { saleStatus: textField(row.saleStatus) } satisfies VenValue,
    };
  }).filter((row): row is VenRow => Boolean(row));
  const present = presentVenLanes(rows);
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
    const next = readHiddenVen(readJson(VEN_HIDE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(VEN_HIDE_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedVen(readJson(VEN_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(VEN_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleVenLanes(present, hidden, showHidden);
  const shown = visibleVen(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = venLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = venLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingVen(rows);
  const leadHue = leadingVenHue(rows);
  const whole = rows.filter((row) => venLane(row.code)).length;
  const share = venShare(laneVenCount(rows, "firm"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("veincomb-lanes.csv", venLanesCsv(rows));
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
    writeJson(VEN_HIDE_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(VEN_REVIEW_KEY, next);
  }

  return (
    <section className="c4-veincomb" aria-label={v4("venTitle")} data-veins="1" data-role={role} data-names="1">
      <header className="c4-veincomb-mast">
        <p className="c4-veincomb-seal" data-logo="mono">{v4("venLogo")}</p>
        <div>
          <p className="c4-veincomb-kicker">{v4("venSub")}</p>
          <h2 className="c4-title">{v4("venTitle")}</h2>
        </div>
        <p className="c4-veincomb-count">{shown.length}</p>
      </header>
      <p className="c4-veincomb-links">
        <Link href={crmv4Href(base, "scg")}>{v4("scgTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("venCustomer")}</Link>
      </p>
      <p className="c4-veincomb-hint">{v4("venHint")}</p>
      {viewer && <p className="c4-veincomb-note">{v4("venViewer")}</p>}
      {queue.loading && <p className="c4-veincomb-meta">{v4("venLoading")}</p>}
      {queue.error && <p className="c4-veincomb-meta">{v4("venFailed")}</p>}
      <p className="c4-veincomb-meta">{v4("venLead")} {laneLabel(v4, lead)} · {v4("venToneLead")} {hueLabel(v4, leadHue)} · {v4("venShare")} {share}</p>
      <div className="c4-veincomb-chart" aria-label={v4("venChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-veincomb-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ height: `${Math.max(12, Math.round((line.count / peak) * 72))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-veincomb-tools">
        <input ref={searchRef} className="c4-field c4-veincomb-search" aria-label={v4("venSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("venSearch")} />
        <label className="c4-lab">{v4("venChart")}<select className="c4-field" aria-label={v4("venChart")} value={shape} onChange={(event) => setShape(event.target.value as VenShape)}>{(Object.keys(SHAPE_KEY) as VenShape[]).map((item) => <option key={item} value={item}>{v4(SHAPE_KEY[item])}</option>)}</select></label>
        <button type="button" className="c4-chip" data-on={hue === "gilt" ? "1" : "0"} onClick={() => setHue(hue === "gilt" ? "all" : "gilt")}>{v4("venGilt")}</button>
        <button type="button" className="c4-chip" data-on={hue === "pearl" ? "1" : "0"} onClick={() => setHue(hue === "pearl" ? "all" : "pearl")}>{v4("venPearl")}</button>
        <button type="button" className="c4-chip" data-on={hue === "ink" ? "1" : "0"} onClick={() => setHue(hue === "ink" ? "all" : "ink")}>{v4("venInk")}</button>
        <button type="button" className="c4-chip" data-on={review === "fresh" ? "1" : "0"} onClick={() => setReview(review === "fresh" ? "all" : "fresh")}>{v4("venFresh")}</button>
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview(review === "reviewed" ? "all" : "reviewed")}>{v4("venReviewed")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{v4("venShow")}</button>
        {present.map((lane) => (
          <button key={lane} type="button" className="c4-chip" data-on={hidden.includes(lane) ? "1" : "0"} onClick={() => storeHidden(toggleVen(hidden, lane))}>{v4("venHide")} {laneLabel(v4, lane)}</button>
        ))}
      </div>
      <div className="c4-veincomb-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkVenReview(reviewed, picked, true))}>{v4("venBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkVenReview(reviewed, picked, false))}>{v4("venBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("veincomb-status.csv", venRowsCsv(shown, reviewed))}>{v4("venRowCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("veincomb-lanes.csv", venLanesCsv(rows))}>{v4("venCsv")}</button>
      </div>
      {!shown.length && !queue.loading && <p className="c4-pay-empty">{v4("venEmpty")}</p>}
      <ul className="c4-veincomb-list">
        {shown.map((row) => {
          const tone = venHue(row.code);
          const name = venCopy(row.code);
          return (
            <li key={row.id} className="c4-veincomb-card" data-mail={venLane(row.code) || "open"} data-hue={tone || "none"} data-home={venLane(row.code) === "firm" ? "1" : "0"} data-away={venHush(row.code) ? "1" : "0"} data-hold={venSoon(row.code) ? "1" : "0"} data-guest={venLost(row.code) ? "1" : "0"} data-open={venOpen(row.code) ? "1" : "0"} data-even={venEven(row.code) ? "1" : "0"} data-digit={venDigit(row.code) ? "1" : "0"} data-letter={venLetter(row.code) ? "1" : "0"} data-mixed={venMixed(row.code) ? "1" : "0"} data-upper={venUpper(row.code) ? "1" : "0"} data-lower={venLower(row.code) ? "1" : "0"} data-space={venSpace(row.code) ? "1" : "0"} data-vowel={venVowel(row.code) ? "1" : "0"} data-tail={venTail(row.code) ? "1" : "0"} data-first={venFirst(row.code) ? "1" : "0"} data-held={venHeld(row.code) ? "1" : "0"} data-join={venPair(row.code) ? "1" : "0"} data-route={venRoute(row.code) ? "1" : "0"} data-brief={venShort(row.code) ? "1" : "0"} data-span={venLongLane(row.code) ? "1" : "0"} data-bare={venBare(row.code) ? "1" : "0"} data-line={venKeep(row.code) ? "1" : "0"} data-desk={venCool(row.code) ? "1" : "0"} data-tally={venTallyLane(row.code) ? "1" : "0"} data-vowel-lane={venVowelLane(row.code) ? "1" : "0"}>
              <label className="c4-veincomb-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-veincomb-meta">{name || v4("venOpen")} · {venStamp(row.code) || "—"} · {venFamily(row.code) || "—"} · {venLength(row.code) ?? "—"} · {laneLabel(v4, venLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-veincomb-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleVenReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("venReviewed") : v4("venReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { navigator.clipboard?.writeText(venCopy(row.code)); setCopied(row.id); }}>{copied === row.id ? v4("venCopied") : v4("venCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.userId || row.id}`)}>{v4("venCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
