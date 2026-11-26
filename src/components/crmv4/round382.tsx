"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  VRD_DENSITY_KEY,
  VRD_KEY,
  VRD_PIGMENTS,
  VRD_VIEW_KEY,
  BOL_HIDE_KEY,
  BOL_REVIEW_KEY,
  addVeil,
  addVeilTag,
  addVeilView,
  briskVeil,
  bulkVeilIvory,
  bulkVeilLift,
  bulkVeilVault,
  bulkVeilTag,
  bulkBolReview,
  busiestPainter,
  dropVeilView,
  editVeil,
  editVeilNote,
  fairPainter,
  groundFocused,
  idleVeil,
  graphiteQuiet,
  laneBolCount,
  lateVeil,
  leadingBol,
  leadingBolHue,
  lowerFilmFocused,
  lowerDayFocused,
  moveVeilFocus,
  overdueVeil,
  presentBolLanes,
  raiseFilmFocused,
  raiseDayFocused,
  readHiddenBol,
  readReviewedBol,
  readVeilViews,
  readVeils,
  reminderVeils,
  restingVeil,
  setVeilFocused,
  setVeilGround,
  setVeilRaised,
  setVeilStar,
  setVeilVault,
  setVeilRack,
  veilBars,
  veilCopy,
  veilCounts,
  veilCsv,
  veilDensity,
  veilPainters,
  veilTimeline,
  bolCool,
  bolCopy,
  bolDigit,
  bolEven,
  bolFamily,
  bolKeep,
  bolFirst,
  bolLost,
  bolHeld,
  bolHue,
  bolHush,
  bolLane,
  bolLanes,
  bolLanesCsv,
  bolLength,
  bolLetter,
  bolLongLane,
  bolLower,
  bolMixed,
  bolOpen,
  bolBare,
  bolRoute,
  bolRowsCsv,
  bolShare,
  bolShort,
  bolSpace,
  bolStamp,
  bolTail,
  bolTallyLane,
  bolPair,
  bolUpper,
  bolVowel,
  bolVowelLane,
  bolSoon,
  sortVeils,
  pinVeilFocused,
  suggestVeilDay,
  suggestVeilGround,
  suggestPigment,
  toggleBol,
  toggleBolReview,
  pigmentCool,
  visibleBolLanes,
  pigmentWarm,
  rackVeilFocused,
  visibleVeils,
  visibleBol,
  type Veil,
  type VeilDensity,
  type VeilSort,
  type VeilRack,
  type VeilView,
  type BolReview,
  type BolRow,
  type BolShape,
  type BolValue,
} from "@/lib/crmv4/round382";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const GROUNDS = ["IVORY", "GRAPHITE", "CHAMPAGNE"] as const;
const DAYS = ["3", "5", "8", "13"] as const;
const FILMS = ["1", "3", "5"] as const;

const TOOL_KEY: Record<string, CrmV4CopyKey> = {
  ochre: "vrdOchre",
  vine: "vrdVine",
  bone: "vrdBone",
  lamp: "vrdLamp",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "vrdAuditSave",
  edit: "vrdAuditEdit",
  note: "vrdAuditNote",
  ground: "vrdAuditGround",
  raise: "vrdAuditRaise",
  free: "vrdAuditFree",
  tray: "vrdAuditTray",
  return: "vrdAuditReturn",
  store: "vrdAuditStore",
  open: "vrdAuditOpen",
  tag: "vrdAuditTag",
  coat: "vrdAuditCoat",
  depth: "vrdAuditDepth",
  lower: "vrdAuditLower",
  star: "vrdAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  firm: "bolLaneFirm",
  hush: "bolLaneHush",
  wait: "bolLaneWait",
  bench: "bolLaneBench",
  gone: "bolLaneGone",
  twin: "bolLaneTwin",
  route: "bolLaneRoute",
  short: "bolLaneShort",
  long: "bolLaneLong",
  tally: "bolLaneTally",
  vowel: "bolLaneVowel",
  plain: "bolLanePlain",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  gilt: "bolGilt",
  pearl: "bolPearl",
  ink: "bolInk",
};

const SHAPE_KEY: Record<BolShape, CrmV4CopyKey> = {
  all: "bolShapeAll",
  firm: "bolShapeFirm",
  hush: "bolShapeHush",
  wait: "bolShapeWait",
  gone: "bolShapeGone",
  bench: "bolShapeBench",
  twin: "bolShapeTwin",
  route: "bolShapeRoute",
  short: "bolShapeShort",
  long: "bolShapeLong",
  tally: "bolShapeTally",
  vowel: "bolShapeVowel",
  plain: "bolShapePlain",
  open: "bolShapeOpen",
  soon: "bolShapeSoon",
  letter: "bolShapeLetter",
  mixed: "bolShapeDigit",
  upper: "bolShapeUpper",
  lower: "bolShapePlain",
  space: "bolShapeSpace",
  even: "bolShapeEven",
  odd: "bolShapeEven",
  tail: "bolShapeTally",
  first: "bolShapePlain",
  held: "bolShapeLong",
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
  return key ? v4(key) : v4("vrdBlankTool");
}

function groundLabel(v4: V4, ground: string): string {
  if (ground === "IVORY") return v4("vrdIvory");
  if (ground === "GRAPHITE") return v4("vrdGraphite");
  if (ground === "CHAMPAGNE") return v4("vrdChampagne");
  return v4("vrdAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("bolBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("bolBlank");
}

export function VerdaccioVeils({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Veil[]>([]);
  const [views, setViews] = useState<VeilView[]>([]);
  const [density, setDensity] = useState<VeilDensity>("open");
  const [tray, setTray] = useState<VeilRack>("wall");
  const [query, setQuery] = useState("");
  const [handFilter, setHandFilter] = useState("");
  const [groundFilter, setGroundFilter] = useState("all");
  const [toolFilter, setToolFilter] = useState("all");
  const [depthFilter, setDepthFilter] = useState("all");
  const [coatFilter, setCoatFilter] = useState("all");
  const [sort, setSort] = useState<VeilSort>("tool");
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
  const [station, setStation] = useState("ochre");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readVeils(readJson(VRD_KEY, [])));
    setViews(readVeilViews(readJson(VRD_VIEW_KEY, [])));
    setDensity(veilDensity(readJson(VRD_DENSITY_KEY, "open")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Veil[]) {
    setCards(next);
    writeJson(VRD_KEY, next);
  }
  function storeViews(next: VeilView[]) {
    setViews(next);
    writeJson(VRD_VIEW_KEY, next);
  }
  function storeDensity(next: VeilDensity) {
    setDensity(next);
    writeJson(VRD_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortVeils(visibleVeils(cards, tray, query, handFilter, groundFilter, toolFilter, depthFilter, coatFilter), sort),
    [cards, tray, query, handFilter, groundFilter, toolFilter, depthFilter, coatFilter, sort],
  );
  const counts = veilCounts(cards, shown, station);
  const bars = veilBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = veilTimeline(cards);
  const reminders = reminderVeils(cards);
  const hands = veilPainters(cards);
  const busy = busiestPainter(cards);
  const fair = fairPainter(cards, hands.join(","));
  const suggestedGround = suggestVeilGround(cards);
  const suggestedDepth = suggestVeilDay(cards, clock);
  const suggestedTool = suggestPigment(clock);
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
        download("verdaccio.csv", veilCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveVeilFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveVeilFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addVeil(cards, { title, note, hand, tool, depth: depthNo, ground, coat: coatNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-verdaccio" aria-label={v4("vrdTitle")} data-cards="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-verdaccio-mast">
        <p className="c4-verdaccio-seal" data-logo="mono">{v4("vrdLogo")}</p>
        <div>
          <p className="c4-verdaccio-kicker">{v4("vrdSub")}</p>
          <h2 className="c4-title">{v4("vrdTitle")}</h2>
        </div>
        <p className="c4-verdaccio-count">{shown.length}</p>
      </header>
      <p className="c4-verdaccio-links">
        <Link href={crmv4Href(base, "bol")}>{v4("bolTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("vrdCustomers")}</Link>
      </p>
      <p className="c4-verdaccio-hint">{v4("vrdHint")}</p>
      {viewer && <p className="c4-verdaccio-note">{v4("vrdViewer")}</p>}
      <p className="c4-verdaccio-meta">{v4("vrdFair")} {fair || "—"} · {v4("vrdBusy")} {busy || "—"} · {v4("vrdSuggest")} {toolLabel(v4, suggestedTool)} · {groundLabel(v4, suggestedGround)} · {suggestedDepth}</p>
      <ol className="c4-verdaccio-index" aria-label={v4("vrdRemind")}>
        <li data-tone="gold">{v4("vrdOverdue")} {counts.overdue}</li>
        <li data-tone="ink">{v4("vrdIdle")} {counts.idle}</li>
        <li data-tone="pearl">{v4("vrdBrisk")} {counts.brisk}</li>
        <li data-tone="pearl">{v4("vrdResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-verdaccio-remind c4-verdaccio-notices" role="status" aria-label={v4("vrdRemind")}>
          {reminders.map((name) => <li key={name}>{v4("vrdOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-verdaccio-chart" aria-label={v4("vrdChart")}>
        {bars.map((bar) => (
          <button key={bar.tool} type="button" className="c4-verdaccio-column" data-on={toolFilter === bar.tool ? "1" : "0"} onClick={() => setToolFilter(toolFilter === bar.tool ? "all" : bar.tool)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{toolLabel(v4, bar.tool)}</span>
          </button>
        ))}
      </div>
      <form className="c4-verdaccio-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("vrdEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("vrdEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("vrdNote")}<input className="c4-field" aria-label={v4("vrdNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("vrdHand")}<input className="c4-field" aria-label={v4("vrdHand")} aria-required={false} value={hand} maxLength={24} disabled={viewer} onChange={(event) => setHand(event.target.value)} /></label>
        <label className="c4-lab">{v4("vrdTool")}<select className="c4-field" aria-label={v4("vrdTool")} value={tool} disabled={viewer} onChange={(event) => setTool(event.target.value)}><option value="">{v4("vrdBlankTool")}</option>{VRD_PIGMENTS.map((item) => <option key={item} value={item}>{toolLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("vrdGround")}<select className="c4-field" aria-label={v4("vrdGround")} value={ground} disabled={viewer} onChange={(event) => setGround(event.target.value)}><option value="">{v4("vrdAll")}</option>{GROUNDS.map((item) => <option key={item} value={item}>{groundLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("vrdDepth")}<select className="c4-field" aria-label={v4("vrdDepth")} value={depthNo} disabled={viewer} onChange={(event) => setDepthNo(event.target.value)}><option value="">{v4("vrdAll")}</option>{DAYS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("vrdCoat")}<select className="c4-field" aria-label={v4("vrdCoat")} value={coatNo} disabled={viewer} onChange={(event) => setCoatNo(event.target.value)}><option value="">{v4("vrdAll")}</option>{FILMS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("vrdTag")}<input className="c4-field" aria-label={v4("vrdTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("vrdAdd")}</button>
      </form>
      <div className="c4-verdaccio-tools">
        <input ref={searchRef} className="c4-field c4-verdaccio-search" aria-label={v4("vrdSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("vrdSearch")} />
        {(["wall", "tray", "store"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "wall" ? "vrdWall" : item === "tray" ? "vrdTray" : "vrdStore")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={toolFilter === "warm" ? "1" : "0"} onClick={() => setToolFilter(toolFilter === "warm" ? "all" : "warm")}>{v4("vrdWarm")}</button>
        <button type="button" className="c4-chip" data-on={toolFilter === "cool" ? "1" : "0"} onClick={() => setToolFilter(toolFilter === "cool" ? "all" : "cool")}>{v4("vrdCool")}</button>
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
        <button type="button" className="c4-chip" data-on={sort === "hand" ? "1" : "0"} onClick={() => setSort(sort === "hand" ? "tool" : "hand")}>{sort === "hand" ? v4("vrdSortHand") : v4("vrdSortTool")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "open" : "tight")}>{density === "tight" ? v4("vrdTight") : v4("vrdOpen")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("vrdTimeline")}</button>
        <label className="c4-lab">{v4("vrdDesk")}<select className="c4-field" aria-label={v4("vrdDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{VRD_PIGMENTS.map((item) => <option key={item} value={item}>{toolLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-verdaccio-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addVeilView(views, { id, name: viewName, tray, query, hand: handFilter, ground: groundFilter, tool: toolFilter, depth: depthFilter, coat: coatFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("vrdViewName")}<input className="c4-field" aria-label={v4("vrdViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("vrdSaveView")}</button>
      </form>
      <ul className="c4-verdaccio-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setHandFilter(view.hand); setGroundFilter(view.ground); setToolFilter(view.tool); setDepthFilter(view.depth); setCoatFilter(view.coat); }}>{v4("vrdApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropVeilView(views, view.id))}>{v4("vrdDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-verdaccio-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkVeilLift(cards, picked))}>{v4("vrdBulkRaise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkVeilVault(cards, picked))}>{v4("vrdBulkStore")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkVeilIvory(cards, picked))}>{v4("vrdBulkIvory")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkVeilTag(cards, picked))}>{v4("vrdBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("verdaccio.csv", veilCsv(shown, station))}>{v4("vrdCsv")}</button>
        <p className="c4-verdaccio-meta">{v4("vrdKeys")} / c x a j k · {v4("vrdQuiet")} {counts.quiet} · {v4("vrdWarm")} {counts.warm}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-verdaccio-time" aria-label={v4("vrdTimeline")}>
          {timeline.map((row) => <li key={row.depth}><span>{row.depth}</span> {row.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("vrdEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-verdaccio-list">
          {shown.map((card) => {
            const late = lateVeil(card, station);
            return (
              <li key={card.id} className="c4-verdaccio-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleVeil(card) ? "1" : "0"} data-brisk={briskVeil(card) ? "1" : "0"} data-overdue={overdueVeil(card) ? "1" : "0"} data-resting={restingVeil(card) ? "1" : "0"} data-warm={pigmentWarm(card.tool) ? "1" : "0"} data-cool={pigmentCool(card.tool) ? "1" : "0"} data-quiet={graphiteQuiet(card.ground) ? "1" : "0"}>
                <label className="c4-verdaccio-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editVeil(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("vrdEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("vrdApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editVeilNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("vrdNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-verdaccio-meta">{toolLabel(v4, card.tool)} · {groundLabel(v4, card.ground)} · {card.depth ?? "—"} · {card.coat} · {card.hand || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "vrdAuditSave")}` : ""}{late ? ` · ${v4("vrdOverdue")}` : ""}</p>
                </div>
                <div className="c4-verdaccio-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("vrdEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setVeilRaised(cards, card.id, !card.raised))}>{card.raised ? v4("vrdFree") : v4("vrdRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setVeilGround(cards, card.id, suggestedGround))}>{v4("vrdSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setVeilRack(cards, card.id, !card.trayed))}>{card.trayed ? v4("vrdUntray") : v4("vrdTrayIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setVeilVault(cards, card.id, !card.stored))}>{card.stored ? v4("vrdUnstore") : v4("vrdStoreIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setVeilStar(cards, card.id, !card.starred))}>{card.starred ? v4("vrdUnstar") : v4("vrdStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addVeilTag(cards, card.id, "v"))}>{v4("vrdTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseDayFocused(cards, card.id))}>{v4("vrdRaiseDepth")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerDayFocused(cards, card.id))}>{v4("vrdLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseFilmFocused(cards, card.id))}>{v4("vrdCoat")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerFilmFocused(cards, card.id))}>{v4("vrdCoat")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(groundFocused(cards, card.id))}>{v4("vrdGround")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setVeilFocused(cards, card.id))}>{v4("vrdRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(rackVeilFocused(cards, card.id))}>{v4("vrdTray")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinVeilFocused(cards, card.id))}>{v4("vrdStar")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(veilCopy(card))}>{v4("vrdCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type CapUser = { id?: string; name?: string | null; retentionStatus?: string | null };

export function BoleGrounds({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: CapUser[] }>("/api/admin/users?take=24&meta=0");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<BolShape>("all");
  const [review, setReview] = useState<BolReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): BolRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      userId: id,
      code: { retentionStatus: textField(row.retentionStatus) } satisfies BolValue,
    };
  }).filter((row): row is BolRow => Boolean(row));
  const present = presentBolLanes(rows);
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
    const next = readHiddenBol(readJson(BOL_HIDE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(BOL_HIDE_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedBol(readJson(BOL_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(BOL_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleBolLanes(present, hidden, showHidden);
  const shown = visibleBol(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = bolLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = bolLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingBol(rows);
  const leadHue = leadingBolHue(rows);
  const whole = rows.filter((row) => bolLane(row.code)).length;
  const share = bolShare(laneBolCount(rows, "firm"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("bole-lanes.csv", bolLanesCsv(rows));
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
    writeJson(BOL_HIDE_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(BOL_REVIEW_KEY, next);
  }

  return (
    <section className="c4-bole" aria-label={v4("bolTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-bole-mast">
        <p className="c4-bole-seal" data-logo="mono">{v4("bolLogo")}</p>
        <div>
          <p className="c4-bole-kicker">{v4("bolSub")}</p>
          <h2 className="c4-title">{v4("bolTitle")}</h2>
        </div>
        <p className="c4-bole-count">{shown.length}</p>
      </header>
      <p className="c4-bole-links">
        <Link href={crmv4Href(base, "vrd")}>{v4("vrdTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("bolCustomer")}</Link>
      </p>
      <p className="c4-bole-hint">{v4("bolHint")}</p>
      {viewer && <p className="c4-bole-note">{v4("bolViewer")}</p>}
      {queue.loading && <p className="c4-bole-meta">{v4("bolLoading")}</p>}
      {queue.error && <p className="c4-bole-meta">{v4("bolFailed")}</p>}
      <p className="c4-bole-meta">{v4("bolLead")} {laneLabel(v4, lead)} · {v4("bolToneLead")} {hueLabel(v4, leadHue)} · {v4("bolShare")} {share}</p>
      <div className="c4-bole-chart" aria-label={v4("bolChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-bole-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ height: `${Math.max(12, Math.round((line.count / peak) * 72))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-bole-tools">
        <input ref={searchRef} className="c4-field c4-bole-search" aria-label={v4("bolSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("bolSearch")} />
        <label className="c4-lab">{v4("bolChart")}<select className="c4-field" aria-label={v4("bolChart")} value={shape} onChange={(event) => setShape(event.target.value as BolShape)}>{(Object.keys(SHAPE_KEY) as BolShape[]).map((item) => <option key={item} value={item}>{v4(SHAPE_KEY[item])}</option>)}</select></label>
        <button type="button" className="c4-chip" data-on={hue === "gilt" ? "1" : "0"} onClick={() => setHue(hue === "gilt" ? "all" : "gilt")}>{v4("bolGilt")}</button>
        <button type="button" className="c4-chip" data-on={hue === "pearl" ? "1" : "0"} onClick={() => setHue(hue === "pearl" ? "all" : "pearl")}>{v4("bolPearl")}</button>
        <button type="button" className="c4-chip" data-on={hue === "ink" ? "1" : "0"} onClick={() => setHue(hue === "ink" ? "all" : "ink")}>{v4("bolInk")}</button>
        <button type="button" className="c4-chip" data-on={review === "fresh" ? "1" : "0"} onClick={() => setReview(review === "fresh" ? "all" : "fresh")}>{v4("bolFresh")}</button>
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview(review === "reviewed" ? "all" : "reviewed")}>{v4("bolReviewed")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{v4("bolShow")}</button>
        {present.map((lane) => (
          <button key={lane} type="button" className="c4-chip" data-on={hidden.includes(lane) ? "1" : "0"} onClick={() => storeHidden(toggleBol(hidden, lane))}>{v4("bolHide")} {laneLabel(v4, lane)}</button>
        ))}
      </div>
      <div className="c4-bole-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkBolReview(reviewed, picked, true))}>{v4("bolBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkBolReview(reviewed, picked, false))}>{v4("bolBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("bole-status.csv", bolRowsCsv(shown, reviewed))}>{v4("bolRowCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("bole-lanes.csv", bolLanesCsv(rows))}>{v4("bolCsv")}</button>
      </div>
      {!shown.length && !queue.loading && <p className="c4-pay-empty">{v4("bolEmpty")}</p>}
      <ul className="c4-bole-list">
        {shown.map((row) => {
          const tone = bolHue(row.code);
          const name = bolCopy(row.code);
          return (
            <li key={row.id} className="c4-bole-card" data-mail={bolLane(row.code) || "open"} data-hue={tone || "none"} data-home={bolLane(row.code) === "firm" ? "1" : "0"} data-away={bolHush(row.code) ? "1" : "0"} data-hold={bolSoon(row.code) ? "1" : "0"} data-guest={bolLost(row.code) ? "1" : "0"} data-open={bolOpen(row.code) ? "1" : "0"} data-even={bolEven(row.code) ? "1" : "0"} data-digit={bolDigit(row.code) ? "1" : "0"} data-letter={bolLetter(row.code) ? "1" : "0"} data-mixed={bolMixed(row.code) ? "1" : "0"} data-upper={bolUpper(row.code) ? "1" : "0"} data-lower={bolLower(row.code) ? "1" : "0"} data-space={bolSpace(row.code) ? "1" : "0"} data-vowel={bolVowel(row.code) ? "1" : "0"} data-tail={bolTail(row.code) ? "1" : "0"} data-first={bolFirst(row.code) ? "1" : "0"} data-held={bolHeld(row.code) ? "1" : "0"} data-join={bolPair(row.code) ? "1" : "0"} data-route={bolRoute(row.code) ? "1" : "0"} data-brief={bolShort(row.code) ? "1" : "0"} data-span={bolLongLane(row.code) ? "1" : "0"} data-bare={bolBare(row.code) ? "1" : "0"} data-line={bolKeep(row.code) ? "1" : "0"} data-desk={bolCool(row.code) ? "1" : "0"} data-tally={bolTallyLane(row.code) ? "1" : "0"} data-vowel-lane={bolVowelLane(row.code) ? "1" : "0"}>
              <label className="c4-bole-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-bole-meta">{name || v4("bolOpen")} · {bolStamp(row.code) || "—"} · {bolFamily(row.code) || "—"} · {bolLength(row.code) ?? "—"} · {laneLabel(v4, bolLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-bole-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleBolReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("bolReviewed") : v4("bolReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { navigator.clipboard?.writeText(bolCopy(row.code)); setCopied(row.id); }}>{copied === row.id ? v4("bolCopied") : v4("bolCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.userId || row.id}`)}>{v4("bolCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
