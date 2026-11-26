"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  SGF_DENSITY_KEY,
  SGF_KEY,
  SGF_TOOLS,
  SGF_VIEW_KEY,
  SNP_HIDE_KEY,
  SNP_REVIEW_KEY,
  addSlip,
  addSlipTag,
  addSlipView,
  briskSlip,
  bulkSlipIvory,
  bulkSlipRaise,
  bulkSlipStore,
  bulkSlipTag,
  bulkSnpReview,
  busiestHand,
  dropSlipView,
  editSlip,
  editSlipNote,
  fairPlasterer,
  groundFocused,
  idleSlip,
  ivoryQuiet,
  laneSnpCount,
  lateSlip,
  leadingSnp,
  leadingSnpHue,
  lowerCoatFocused,
  lowerDepthFocused,
  moveSlipFocus,
  overdueSlip,
  presentSnpLanes,
  raiseCoatFocused,
  raiseDepthFocused,
  readHiddenSnp,
  readReviewedSnp,
  readSlipViews,
  readSlips,
  reminderSlips,
  restingSlip,
  setSlipFocused,
  setSlipGround,
  setSlipRaised,
  setSlipStar,
  setSlipStore,
  setSlipTray,
  slipBars,
  slipCopy,
  slipCounts,
  slipCsv,
  slipDensity,
  slipHands,
  slipTimeline,
  snpBench,
  snpCopy,
  snpDigit,
  snpEven,
  snpFamily,
  snpFirm,
  snpFirst,
  snpGone,
  snpHeld,
  snpHue,
  snpHush,
  snpLane,
  snpLanes,
  snpLanesCsv,
  snpLength,
  snpLetter,
  snpLongLane,
  snpLower,
  snpMixed,
  snpOpen,
  snpPlain,
  snpRoute,
  snpRowsCsv,
  snpShare,
  snpShort,
  snpSpace,
  snpStamp,
  snpTail,
  snpTallyLane,
  snpTwin,
  snpUpper,
  snpVowel,
  snpVowelLane,
  snpWait,
  sortSlips,
  starSlipFocused,
  suggestDepth,
  suggestGround,
  suggestTool,
  toggleSnp,
  toggleSnpReview,
  toolCool,
  visibleSnpLanes,
  toolWarm,
  traySlipFocused,
  visibleSlips,
  visibleSnp,
  type Slip,
  type SlipDensity,
  type SlipSort,
  type SlipTray,
  type SlipView,
  type SnpReview,
  type SnpRow,
  type SnpShape,
  type SnpValue,
} from "@/lib/crmv4/round381";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const GROUNDS = ["IVORY", "GRAPHITE", "CHAMPAGNE"] as const;
const DEPTHS = ["8", "16", "32", "64"] as const;
const COATS = ["2", "4", "6"] as const;

const TOOL_KEY: Record<string, CrmV4CopyKey> = {
  stylus: "sgfStylus",
  knife: "sgfKnife",
  comb: "sgfComb",
  brush: "sgfBrush",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "sgfAuditSave",
  edit: "sgfAuditEdit",
  note: "sgfAuditNote",
  ground: "sgfAuditGround",
  raise: "sgfAuditRaise",
  free: "sgfAuditFree",
  tray: "sgfAuditTray",
  return: "sgfAuditReturn",
  store: "sgfAuditStore",
  open: "sgfAuditOpen",
  tag: "sgfAuditTag",
  coat: "sgfAuditCoat",
  depth: "sgfAuditDepth",
  lower: "sgfAuditLower",
  star: "sgfAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  firm: "snpLaneFirm",
  hush: "snpLaneHush",
  wait: "snpLaneWait",
  bench: "snpLaneBench",
  gone: "snpLaneGone",
  twin: "snpLaneTwin",
  route: "snpLaneRoute",
  short: "snpLaneShort",
  long: "snpLaneLong",
  tally: "snpLaneTally",
  vowel: "snpLaneVowel",
  plain: "snpLanePlain",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  gilt: "snpGilt",
  pearl: "snpPearl",
  ink: "snpInk",
};

const SHAPE_KEY: Record<SnpShape, CrmV4CopyKey> = {
  all: "snpShapeAll",
  firm: "snpShapeFirm",
  hush: "snpShapeHush",
  wait: "snpShapeWait",
  gone: "snpShapeGone",
  bench: "snpShapeBench",
  twin: "snpShapeTwin",
  route: "snpShapeRoute",
  short: "snpShapeShort",
  long: "snpShapeLong",
  tally: "snpShapeTally",
  vowel: "snpShapeVowel",
  plain: "snpShapePlain",
  open: "snpShapeOpen",
  soon: "snpShapeSoon",
  letter: "snpShapeLetter",
  mixed: "snpShapeDigit",
  upper: "snpShapeUpper",
  lower: "snpShapePlain",
  space: "snpShapeSpace",
  even: "snpShapeEven",
  odd: "snpShapeEven",
  tail: "snpShapeTally",
  first: "snpShapePlain",
  held: "snpShapeLong",
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
  return key ? v4(key) : v4("sgfBlankTool");
}

function groundLabel(v4: V4, ground: string): string {
  if (ground === "IVORY") return v4("sgfIvory");
  if (ground === "GRAPHITE") return v4("sgfGraphite");
  if (ground === "CHAMPAGNE") return v4("sgfChampagne");
  return v4("sgfAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("snpBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("snpBlank");
}

export function SgraffitoSlips({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Slip[]>([]);
  const [views, setViews] = useState<SlipView[]>([]);
  const [density, setDensity] = useState<SlipDensity>("open");
  const [tray, setTray] = useState<SlipTray>("wall");
  const [query, setQuery] = useState("");
  const [handFilter, setHandFilter] = useState("");
  const [groundFilter, setGroundFilter] = useState("all");
  const [toolFilter, setToolFilter] = useState("all");
  const [depthFilter, setDepthFilter] = useState("all");
  const [coatFilter, setCoatFilter] = useState("all");
  const [sort, setSort] = useState<SlipSort>("tool");
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
  const [station, setStation] = useState("stylus");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readSlips(readJson(SGF_KEY, [])));
    setViews(readSlipViews(readJson(SGF_VIEW_KEY, [])));
    setDensity(slipDensity(readJson(SGF_DENSITY_KEY, "open")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Slip[]) {
    setCards(next);
    writeJson(SGF_KEY, next);
  }
  function storeViews(next: SlipView[]) {
    setViews(next);
    writeJson(SGF_VIEW_KEY, next);
  }
  function storeDensity(next: SlipDensity) {
    setDensity(next);
    writeJson(SGF_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortSlips(visibleSlips(cards, tray, query, handFilter, groundFilter, toolFilter, depthFilter, coatFilter), sort),
    [cards, tray, query, handFilter, groundFilter, toolFilter, depthFilter, coatFilter, sort],
  );
  const counts = slipCounts(cards, shown, station);
  const bars = slipBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = slipTimeline(cards);
  const reminders = reminderSlips(cards);
  const hands = slipHands(cards);
  const busy = busiestHand(cards);
  const fair = fairPlasterer(cards, hands.join(","));
  const suggestedGround = suggestGround(cards);
  const suggestedDepth = suggestDepth(cards, clock);
  const suggestedTool = suggestTool(clock);
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
        download("sgraffito.csv", slipCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveSlipFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveSlipFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addSlip(cards, { title, note, hand, tool, depth: depthNo, ground, coat: coatNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-sgraffito" aria-label={v4("sgfTitle")} data-cards="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-sgraffito-mast">
        <p className="c4-sgraffito-seal" data-logo="mono">{v4("sgfLogo")}</p>
        <div>
          <p className="c4-sgraffito-kicker">{v4("sgfSub")}</p>
          <h2 className="c4-title">{v4("sgfTitle")}</h2>
        </div>
        <p className="c4-sgraffito-count">{shown.length}</p>
      </header>
      <p className="c4-sgraffito-links">
        <Link href={crmv4Href(base, "snp")}>{v4("snpTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("sgfCustomers")}</Link>
      </p>
      <p className="c4-sgraffito-hint">{v4("sgfHint")}</p>
      {viewer && <p className="c4-sgraffito-note">{v4("sgfViewer")}</p>}
      <p className="c4-sgraffito-meta">{v4("sgfFair")} {fair || "—"} · {v4("sgfBusy")} {busy || "—"} · {v4("sgfSuggest")} {toolLabel(v4, suggestedTool)} · {groundLabel(v4, suggestedGround)} · {suggestedDepth}</p>
      <ol className="c4-sgraffito-index" aria-label={v4("sgfRemind")}>
        <li data-tone="gold">{v4("sgfOverdue")} {counts.overdue}</li>
        <li data-tone="ink">{v4("sgfIdle")} {counts.idle}</li>
        <li data-tone="pearl">{v4("sgfBrisk")} {counts.brisk}</li>
        <li data-tone="pearl">{v4("sgfResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-sgraffito-remind c4-sgraffito-notices" role="status" aria-label={v4("sgfRemind")}>
          {reminders.map((name) => <li key={name}>{v4("sgfOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-sgraffito-chart" aria-label={v4("sgfChart")}>
        {bars.map((bar) => (
          <button key={bar.tool} type="button" className="c4-sgraffito-column" data-on={toolFilter === bar.tool ? "1" : "0"} onClick={() => setToolFilter(toolFilter === bar.tool ? "all" : bar.tool)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{toolLabel(v4, bar.tool)}</span>
          </button>
        ))}
      </div>
      <form className="c4-sgraffito-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("sgfEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("sgfEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("sgfNote")}<input className="c4-field" aria-label={v4("sgfNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("sgfHand")}<input className="c4-field" aria-label={v4("sgfHand")} aria-required={false} value={hand} maxLength={24} disabled={viewer} onChange={(event) => setHand(event.target.value)} /></label>
        <label className="c4-lab">{v4("sgfTool")}<select className="c4-field" aria-label={v4("sgfTool")} value={tool} disabled={viewer} onChange={(event) => setTool(event.target.value)}><option value="">{v4("sgfBlankTool")}</option>{SGF_TOOLS.map((item) => <option key={item} value={item}>{toolLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("sgfGround")}<select className="c4-field" aria-label={v4("sgfGround")} value={ground} disabled={viewer} onChange={(event) => setGround(event.target.value)}><option value="">{v4("sgfAll")}</option>{GROUNDS.map((item) => <option key={item} value={item}>{groundLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("sgfDepth")}<select className="c4-field" aria-label={v4("sgfDepth")} value={depthNo} disabled={viewer} onChange={(event) => setDepthNo(event.target.value)}><option value="">{v4("sgfAll")}</option>{DEPTHS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("sgfCoat")}<select className="c4-field" aria-label={v4("sgfCoat")} value={coatNo} disabled={viewer} onChange={(event) => setCoatNo(event.target.value)}><option value="">{v4("sgfAll")}</option>{COATS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("sgfTag")}<input className="c4-field" aria-label={v4("sgfTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("sgfAdd")}</button>
      </form>
      <div className="c4-sgraffito-tools">
        <input ref={searchRef} className="c4-field c4-sgraffito-search" aria-label={v4("sgfSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("sgfSearch")} />
        {(["wall", "tray", "store"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "wall" ? "sgfWall" : item === "tray" ? "sgfTray" : "sgfStore")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={toolFilter === "warm" ? "1" : "0"} onClick={() => setToolFilter(toolFilter === "warm" ? "all" : "warm")}>{v4("sgfWarm")}</button>
        <button type="button" className="c4-chip" data-on={toolFilter === "cool" ? "1" : "0"} onClick={() => setToolFilter(toolFilter === "cool" ? "all" : "cool")}>{v4("sgfCool")}</button>
        {GROUNDS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={groundFilter === item ? "1" : "0"} onClick={() => setGroundFilter(groundFilter === item ? "all" : item)}>{groundLabel(v4, item)}</button>
        ))}
        {DEPTHS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={depthFilter === item ? "1" : "0"} onClick={() => setDepthFilter(depthFilter === item ? "all" : item)}>{item}</button>
        ))}
        {COATS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={coatFilter === item ? "1" : "0"} onClick={() => setCoatFilter(coatFilter === item ? "all" : item)}>{item}</button>
        ))}
        {hands.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={handFilter === name ? "1" : "0"} onClick={() => setHandFilter(handFilter === name ? "" : name)}>{name}</button>
        ))}
        <button type="button" className="c4-chip" data-on={sort === "hand" ? "1" : "0"} onClick={() => setSort(sort === "hand" ? "tool" : "hand")}>{sort === "hand" ? v4("sgfSortHand") : v4("sgfSortTool")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "open" : "tight")}>{density === "tight" ? v4("sgfTight") : v4("sgfOpen")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("sgfTimeline")}</button>
        <label className="c4-lab">{v4("sgfDesk")}<select className="c4-field" aria-label={v4("sgfDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{SGF_TOOLS.map((item) => <option key={item} value={item}>{toolLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-sgraffito-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addSlipView(views, { id, name: viewName, tray, query, hand: handFilter, ground: groundFilter, tool: toolFilter, depth: depthFilter, coat: coatFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("sgfViewName")}<input className="c4-field" aria-label={v4("sgfViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("sgfSaveView")}</button>
      </form>
      <ul className="c4-sgraffito-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setHandFilter(view.hand); setGroundFilter(view.ground); setToolFilter(view.tool); setDepthFilter(view.depth); setCoatFilter(view.coat); }}>{v4("sgfApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropSlipView(views, view.id))}>{v4("sgfDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-sgraffito-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkSlipRaise(cards, picked))}>{v4("sgfBulkRaise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkSlipStore(cards, picked))}>{v4("sgfBulkStore")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkSlipIvory(cards, picked))}>{v4("sgfBulkIvory")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkSlipTag(cards, picked))}>{v4("sgfBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("sgraffito.csv", slipCsv(shown, station))}>{v4("sgfCsv")}</button>
        <p className="c4-sgraffito-meta">{v4("sgfKeys")} / c x a j k · {v4("sgfQuiet")} {counts.quiet} · {v4("sgfWarm")} {counts.warm}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-sgraffito-time" aria-label={v4("sgfTimeline")}>
          {timeline.map((row) => <li key={row.depth}><span>{row.depth}</span> {row.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("sgfEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-sgraffito-list">
          {shown.map((card) => {
            const late = lateSlip(card, station);
            return (
              <li key={card.id} className="c4-sgraffito-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleSlip(card) ? "1" : "0"} data-brisk={briskSlip(card) ? "1" : "0"} data-overdue={overdueSlip(card) ? "1" : "0"} data-resting={restingSlip(card) ? "1" : "0"} data-warm={toolWarm(card.tool) ? "1" : "0"} data-cool={toolCool(card.tool) ? "1" : "0"} data-quiet={ivoryQuiet(card.ground) ? "1" : "0"}>
                <label className="c4-sgraffito-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editSlip(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("sgfEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("sgfApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editSlipNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("sgfNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-sgraffito-meta">{toolLabel(v4, card.tool)} · {groundLabel(v4, card.ground)} · {card.depth ?? "—"} · {card.coat} · {card.hand || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "sgfAuditSave")}` : ""}{late ? ` · ${v4("sgfOverdue")}` : ""}</p>
                </div>
                <div className="c4-sgraffito-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("sgfEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSlipRaised(cards, card.id, !card.raised))}>{card.raised ? v4("sgfFree") : v4("sgfRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSlipGround(cards, card.id, suggestedGround))}>{v4("sgfSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSlipTray(cards, card.id, !card.trayed))}>{card.trayed ? v4("sgfUntray") : v4("sgfTrayIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSlipStore(cards, card.id, !card.stored))}>{card.stored ? v4("sgfUnstore") : v4("sgfStoreIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSlipStar(cards, card.id, !card.starred))}>{card.starred ? v4("sgfUnstar") : v4("sgfStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addSlipTag(cards, card.id, "s"))}>{v4("sgfTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseDepthFocused(cards, card.id))}>{v4("sgfRaiseDepth")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerDepthFocused(cards, card.id))}>{v4("sgfLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseCoatFocused(cards, card.id))}>{v4("sgfCoat")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerCoatFocused(cards, card.id))}>{v4("sgfCoat")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(groundFocused(cards, card.id))}>{v4("sgfGround")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSlipFocused(cards, card.id))}>{v4("sgfRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(traySlipFocused(cards, card.id))}>{v4("sgfTray")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(starSlipFocused(cards, card.id))}>{v4("sgfStar")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(slipCopy(card))}>{v4("sgfCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type CapUser = { id?: string; name?: string | null; assigneeName?: string | null };

export function SinopiaCartoons({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: CapUser[] }>("/api/admin/users?take=24&meta=0");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<SnpShape>("all");
  const [review, setReview] = useState<SnpReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): SnpRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      userId: id,
      code: { assigneeName: textField(row.assigneeName) } satisfies SnpValue,
    };
  }).filter((row): row is SnpRow => Boolean(row));
  const present = presentSnpLanes(rows);
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
    const next = readHiddenSnp(readJson(SNP_HIDE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(SNP_HIDE_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedSnp(readJson(SNP_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(SNP_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleSnpLanes(present, hidden, showHidden);
  const shown = visibleSnp(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = snpLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = snpLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingSnp(rows);
  const leadHue = leadingSnpHue(rows);
  const whole = rows.filter((row) => snpLane(row.code)).length;
  const share = snpShare(laneSnpCount(rows, "firm"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("sinopia-lanes.csv", snpLanesCsv(rows));
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
    writeJson(SNP_HIDE_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(SNP_REVIEW_KEY, next);
  }

  return (
    <section className="c4-sinopia" aria-label={v4("snpTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-sinopia-mast">
        <p className="c4-sinopia-seal" data-logo="mono">{v4("snpLogo")}</p>
        <div>
          <p className="c4-sinopia-kicker">{v4("snpSub")}</p>
          <h2 className="c4-title">{v4("snpTitle")}</h2>
        </div>
        <p className="c4-sinopia-count">{shown.length}</p>
      </header>
      <p className="c4-sinopia-links">
        <Link href={crmv4Href(base, "sgf")}>{v4("sgfTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("snpCustomer")}</Link>
      </p>
      <p className="c4-sinopia-hint">{v4("snpHint")}</p>
      {viewer && <p className="c4-sinopia-note">{v4("snpViewer")}</p>}
      {queue.loading && <p className="c4-sinopia-meta">{v4("snpLoading")}</p>}
      {queue.error && <p className="c4-sinopia-meta">{v4("snpFailed")}</p>}
      <p className="c4-sinopia-meta">{v4("snpLead")} {laneLabel(v4, lead)} · {v4("snpToneLead")} {hueLabel(v4, leadHue)} · {v4("snpShare")} {share}</p>
      <div className="c4-sinopia-chart" aria-label={v4("snpChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-sinopia-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ height: `${Math.max(12, Math.round((line.count / peak) * 72))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-sinopia-tools">
        <input ref={searchRef} className="c4-field c4-sinopia-search" aria-label={v4("snpSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("snpSearch")} />
        <label className="c4-lab">{v4("snpChart")}<select className="c4-field" aria-label={v4("snpChart")} value={shape} onChange={(event) => setShape(event.target.value as SnpShape)}>{(Object.keys(SHAPE_KEY) as SnpShape[]).map((item) => <option key={item} value={item}>{v4(SHAPE_KEY[item])}</option>)}</select></label>
        <button type="button" className="c4-chip" data-on={hue === "gilt" ? "1" : "0"} onClick={() => setHue(hue === "gilt" ? "all" : "gilt")}>{v4("snpGilt")}</button>
        <button type="button" className="c4-chip" data-on={hue === "pearl" ? "1" : "0"} onClick={() => setHue(hue === "pearl" ? "all" : "pearl")}>{v4("snpPearl")}</button>
        <button type="button" className="c4-chip" data-on={hue === "ink" ? "1" : "0"} onClick={() => setHue(hue === "ink" ? "all" : "ink")}>{v4("snpInk")}</button>
        <button type="button" className="c4-chip" data-on={review === "fresh" ? "1" : "0"} onClick={() => setReview(review === "fresh" ? "all" : "fresh")}>{v4("snpFresh")}</button>
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview(review === "reviewed" ? "all" : "reviewed")}>{v4("snpReviewed")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{v4("snpShow")}</button>
        {present.map((lane) => (
          <button key={lane} type="button" className="c4-chip" data-on={hidden.includes(lane) ? "1" : "0"} onClick={() => storeHidden(toggleSnp(hidden, lane))}>{v4("snpHide")} {laneLabel(v4, lane)}</button>
        ))}
      </div>
      <div className="c4-sinopia-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkSnpReview(reviewed, picked, true))}>{v4("snpBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkSnpReview(reviewed, picked, false))}>{v4("snpBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("sinopia-keepers.csv", snpRowsCsv(shown, reviewed))}>{v4("snpRowCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("sinopia-lanes.csv", snpLanesCsv(rows))}>{v4("snpCsv")}</button>
      </div>
      {!shown.length && !queue.loading && <p className="c4-pay-empty">{v4("snpEmpty")}</p>}
      <ul className="c4-sinopia-list">
        {shown.map((row) => {
          const tone = snpHue(row.code);
          const name = snpCopy(row.code);
          return (
            <li key={row.id} className="c4-sinopia-card" data-mail={snpLane(row.code) || "open"} data-hue={tone || "none"} data-home={snpLane(row.code) === "firm" ? "1" : "0"} data-away={snpHush(row.code) ? "1" : "0"} data-hold={snpWait(row.code) ? "1" : "0"} data-guest={snpGone(row.code) ? "1" : "0"} data-open={snpOpen(row.code) ? "1" : "0"} data-even={snpEven(row.code) ? "1" : "0"} data-digit={snpDigit(row.code) ? "1" : "0"} data-letter={snpLetter(row.code) ? "1" : "0"} data-mixed={snpMixed(row.code) ? "1" : "0"} data-upper={snpUpper(row.code) ? "1" : "0"} data-lower={snpLower(row.code) ? "1" : "0"} data-space={snpSpace(row.code) ? "1" : "0"} data-vowel={snpVowel(row.code) ? "1" : "0"} data-tail={snpTail(row.code) ? "1" : "0"} data-first={snpFirst(row.code) ? "1" : "0"} data-held={snpHeld(row.code) ? "1" : "0"} data-join={snpTwin(row.code) ? "1" : "0"} data-route={snpRoute(row.code) ? "1" : "0"} data-brief={snpShort(row.code) ? "1" : "0"} data-span={snpLongLane(row.code) ? "1" : "0"} data-bare={snpPlain(row.code) ? "1" : "0"} data-line={snpFirm(row.code) ? "1" : "0"} data-desk={snpBench(row.code) ? "1" : "0"} data-tally={snpTallyLane(row.code) ? "1" : "0"} data-vowel-lane={snpVowelLane(row.code) ? "1" : "0"}>
              <label className="c4-sinopia-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-sinopia-meta">{name || v4("snpOpen")} · {snpStamp(row.code) || "—"} · {snpFamily(row.code) || "—"} · {snpLength(row.code) ?? "—"} · {laneLabel(v4, snpLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-sinopia-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleSnpReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("snpReviewed") : v4("snpReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { navigator.clipboard?.writeText(snpCopy(row.code)); setCopied(row.id); }}>{copied === row.id ? v4("snpCopied") : v4("snpCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.userId || row.id}`)}>{v4("snpCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
