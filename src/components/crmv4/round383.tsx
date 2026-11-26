"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  MZT_DENSITY_KEY,
  MZT_KEY,
  MZT_PIGMENTS,
  MZT_VIEW_KEY,
  MAC_HIDE_KEY,
  MAC_REVIEW_KEY,
  addPlate,
  addPlateTag,
  addPlateView,
  briskPlate,
  bulkPlateIvory,
  bulkPlateLift,
  bulkPlateVault,
  bulkPlateTag,
  bulkMacReview,
  busiestHand,
  dropPlateView,
  editPlate,
  editPlateNote,
  fairHand,
  groundFocused,
  idlePlate,
  graphiteQuiet,
  laneMacCount,
  latePlate,
  leadingMac,
  leadingMacHue,
  lowerFilmFocused,
  lowerDayFocused,
  movePlateFocus,
  overduePlate,
  presentMacLanes,
  raiseFilmFocused,
  raiseDayFocused,
  readHiddenMac,
  readReviewedMac,
  readPlateViews,
  readPlates,
  reminderPlates,
  restingPlate,
  setPlateFocused,
  setPlateGround,
  setPlateRaised,
  setPlateStar,
  setPlateVault,
  setPlateRack,
  plateBars,
  plateCopy,
  plateCounts,
  plateCsv,
  plateDensity,
  plateHands,
  plateTimeline,
  macCool,
  macCopy,
  macDigit,
  macEven,
  macFamily,
  macKeep,
  macFirst,
  macLost,
  macHeld,
  macHue,
  macHush,
  macLane,
  macLanes,
  macLanesCsv,
  macLength,
  macLetter,
  macLongLane,
  macLower,
  macMixed,
  macOpen,
  macBare,
  macRoute,
  macRowsCsv,
  macShare,
  macShort,
  macSpace,
  macStamp,
  macTail,
  macTallyLane,
  macPair,
  macUpper,
  macVowel,
  macVowelLane,
  macSoon,
  sortPlates,
  pinPlateFocused,
  suggestPlateDay,
  suggestPlateGround,
  suggestRocker,
  toggleMac,
  toggleMacReview,
  rockerCool,
  visibleMacLanes,
  rockerWarm,
  rackPlateFocused,
  visiblePlates,
  visibleMac,
  type Plate,
  type PlateDensity,
  type PlateSort,
  type PlateRack,
  type PlateView,
  type MacReview,
  type MacRow,
  type MacShape,
  type MacValue,
} from "@/lib/crmv4/round383";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const GROUNDS = ["IVORY", "GRAPHITE", "CHAMPAGNE"] as const;
const DAYS = ["4", "6", "9", "15"] as const;
const FILMS = ["2", "4", "6"] as const;

const TOOL_KEY: Record<string, CrmV4CopyKey> = {
  rocker: "mztOchre",
  roulette: "mztVine",
  burnisher: "mztBone",
  scraper: "mztLamp",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "mztAuditSave",
  edit: "mztAuditEdit",
  note: "mztAuditNote",
  ground: "mztAuditGround",
  raise: "mztAuditRaise",
  free: "mztAuditFree",
  tray: "mztAuditTray",
  return: "mztAuditReturn",
  store: "mztAuditStore",
  open: "mztAuditOpen",
  tag: "mztAuditTag",
  coat: "mztAuditCoat",
  depth: "mztAuditDepth",
  lower: "mztAuditLower",
  star: "mztAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  firm: "macLaneFirm",
  hush: "macLaneHush",
  wait: "macLaneWait",
  bench: "macLaneBench",
  gone: "macLaneGone",
  twin: "macLaneTwin",
  route: "macLaneRoute",
  short: "macLaneShort",
  long: "macLaneLong",
  tally: "macLaneTally",
  vowel: "macLaneVowel",
  plain: "macLanePlain",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  gilt: "macGilt",
  pearl: "macPearl",
  ink: "macInk",
};

const SHAPE_KEY: Record<MacShape, CrmV4CopyKey> = {
  all: "macShapeAll",
  firm: "macShapeFirm",
  hush: "macShapeHush",
  wait: "macShapeWait",
  gone: "macShapeGone",
  bench: "macShapeBench",
  twin: "macShapeTwin",
  route: "macShapeRoute",
  short: "macShapeShort",
  long: "macShapeLong",
  tally: "macShapeTally",
  vowel: "macShapeVowel",
  plain: "macShapePlain",
  open: "macShapeOpen",
  soon: "macShapeSoon",
  letter: "macShapeLetter",
  mixed: "macShapeDigit",
  upper: "macShapeUpper",
  lower: "macShapePlain",
  space: "macShapeSpace",
  even: "macShapeEven",
  odd: "macShapeEven",
  tail: "macShapeTally",
  first: "macShapePlain",
  held: "macShapeLong",
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
  return key ? v4(key) : v4("mztBlankTool");
}

function groundLabel(v4: V4, ground: string): string {
  if (ground === "IVORY") return v4("mztIvory");
  if (ground === "GRAPHITE") return v4("mztGraphite");
  if (ground === "CHAMPAGNE") return v4("mztChampagne");
  return v4("mztAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("macBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("macBlank");
}

export function MezzotintPlates({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Plate[]>([]);
  const [views, setViews] = useState<PlateView[]>([]);
  const [density, setDensity] = useState<PlateDensity>("open");
  const [tray, setTray] = useState<PlateRack>("wall");
  const [query, setQuery] = useState("");
  const [handFilter, setHandFilter] = useState("");
  const [groundFilter, setGroundFilter] = useState("all");
  const [toolFilter, setToolFilter] = useState("all");
  const [depthFilter, setDepthFilter] = useState("all");
  const [coatFilter, setCoatFilter] = useState("all");
  const [sort, setSort] = useState<PlateSort>("tool");
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
  const [station, setStation] = useState("rocker");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readPlates(readJson(MZT_KEY, [])));
    setViews(readPlateViews(readJson(MZT_VIEW_KEY, [])));
    setDensity(plateDensity(readJson(MZT_DENSITY_KEY, "open")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Plate[]) {
    setCards(next);
    writeJson(MZT_KEY, next);
  }
  function storeViews(next: PlateView[]) {
    setViews(next);
    writeJson(MZT_VIEW_KEY, next);
  }
  function storeDensity(next: PlateDensity) {
    setDensity(next);
    writeJson(MZT_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortPlates(visiblePlates(cards, tray, query, handFilter, groundFilter, toolFilter, depthFilter, coatFilter), sort),
    [cards, tray, query, handFilter, groundFilter, toolFilter, depthFilter, coatFilter, sort],
  );
  const counts = plateCounts(cards, shown, station);
  const bars = plateBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = plateTimeline(cards);
  const reminders = reminderPlates(cards);
  const hands = plateHands(cards);
  const busy = busiestHand(cards);
  const fair = fairHand(cards, hands.join(","));
  const suggestedGround = suggestPlateGround(cards);
  const suggestedDepth = suggestPlateDay(cards, clock);
  const suggestedTool = suggestRocker(clock);
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
        download("mezzotint.csv", plateCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => movePlateFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => movePlateFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addPlate(cards, { title, note, hand, tool, depth: depthNo, ground, coat: coatNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-mezzotint" aria-label={v4("mztTitle")} data-cards="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-mezzotint-mast">
        <p className="c4-mezzotint-seal" data-logo="mono">{v4("mztLogo")}</p>
        <div>
          <p className="c4-mezzotint-kicker">{v4("mztSub")}</p>
          <h2 className="c4-title">{v4("mztTitle")}</h2>
        </div>
        <p className="c4-mezzotint-count">{shown.length}</p>
      </header>
      <p className="c4-mezzotint-links">
        <Link href={crmv4Href(base, "mac")}>{v4("macTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("mztCustomers")}</Link>
      </p>
      <p className="c4-mezzotint-hint">{v4("mztHint")}</p>
      {viewer && <p className="c4-mezzotint-note">{v4("mztViewer")}</p>}
      <p className="c4-mezzotint-meta">{v4("mztFair")} {fair || "—"} · {v4("mztBusy")} {busy || "—"} · {v4("mztSuggest")} {toolLabel(v4, suggestedTool)} · {groundLabel(v4, suggestedGround)} · {suggestedDepth}</p>
      <ol className="c4-mezzotint-index" aria-label={v4("mztRemind")}>
        <li data-tone="gold">{v4("mztOverdue")} {counts.overdue}</li>
        <li data-tone="ink">{v4("mztIdle")} {counts.idle}</li>
        <li data-tone="pearl">{v4("mztBrisk")} {counts.brisk}</li>
        <li data-tone="pearl">{v4("mztResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-mezzotint-remind c4-mezzotint-notices" role="status" aria-label={v4("mztRemind")}>
          {reminders.map((name) => <li key={name}>{v4("mztOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-mezzotint-chart" aria-label={v4("mztChart")}>
        {bars.map((bar) => (
          <button key={bar.tool} type="button" className="c4-mezzotint-column" data-on={toolFilter === bar.tool ? "1" : "0"} onClick={() => setToolFilter(toolFilter === bar.tool ? "all" : bar.tool)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{toolLabel(v4, bar.tool)}</span>
          </button>
        ))}
      </div>
      <form className="c4-mezzotint-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("mztEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("mztEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("mztNote")}<input className="c4-field" aria-label={v4("mztNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("mztHand")}<input className="c4-field" aria-label={v4("mztHand")} aria-required={false} value={hand} maxLength={24} disabled={viewer} onChange={(event) => setHand(event.target.value)} /></label>
        <label className="c4-lab">{v4("mztTool")}<select className="c4-field" aria-label={v4("mztTool")} value={tool} disabled={viewer} onChange={(event) => setTool(event.target.value)}><option value="">{v4("mztBlankTool")}</option>{MZT_PIGMENTS.map((item) => <option key={item} value={item}>{toolLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("mztGround")}<select className="c4-field" aria-label={v4("mztGround")} value={ground} disabled={viewer} onChange={(event) => setGround(event.target.value)}><option value="">{v4("mztAll")}</option>{GROUNDS.map((item) => <option key={item} value={item}>{groundLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("mztDepth")}<select className="c4-field" aria-label={v4("mztDepth")} value={depthNo} disabled={viewer} onChange={(event) => setDepthNo(event.target.value)}><option value="">{v4("mztAll")}</option>{DAYS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("mztCoat")}<select className="c4-field" aria-label={v4("mztCoat")} value={coatNo} disabled={viewer} onChange={(event) => setCoatNo(event.target.value)}><option value="">{v4("mztAll")}</option>{FILMS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("mztTag")}<input className="c4-field" aria-label={v4("mztTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("mztAdd")}</button>
      </form>
      <div className="c4-mezzotint-tools">
        <input ref={searchRef} className="c4-field c4-mezzotint-search" aria-label={v4("mztSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("mztSearch")} />
        {(["wall", "tray", "store"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "wall" ? "mztWall" : item === "tray" ? "mztTray" : "mztStore")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={toolFilter === "warm" ? "1" : "0"} onClick={() => setToolFilter(toolFilter === "warm" ? "all" : "warm")}>{v4("mztWarm")}</button>
        <button type="button" className="c4-chip" data-on={toolFilter === "cool" ? "1" : "0"} onClick={() => setToolFilter(toolFilter === "cool" ? "all" : "cool")}>{v4("mztCool")}</button>
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
        <button type="button" className="c4-chip" data-on={sort === "hand" ? "1" : "0"} onClick={() => setSort(sort === "hand" ? "tool" : "hand")}>{sort === "hand" ? v4("mztSortHand") : v4("mztSortTool")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "open" : "tight")}>{density === "tight" ? v4("mztTight") : v4("mztOpen")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("mztTimeline")}</button>
        <label className="c4-lab">{v4("mztDesk")}<select className="c4-field" aria-label={v4("mztDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{MZT_PIGMENTS.map((item) => <option key={item} value={item}>{toolLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-mezzotint-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addPlateView(views, { id, name: viewName, tray, query, hand: handFilter, ground: groundFilter, tool: toolFilter, depth: depthFilter, coat: coatFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("mztViewName")}<input className="c4-field" aria-label={v4("mztViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("mztSaveView")}</button>
      </form>
      <ul className="c4-mezzotint-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setHandFilter(view.hand); setGroundFilter(view.ground); setToolFilter(view.tool); setDepthFilter(view.depth); setCoatFilter(view.coat); }}>{v4("mztApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropPlateView(views, view.id))}>{v4("mztDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-mezzotint-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkPlateLift(cards, picked))}>{v4("mztBulkRaise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkPlateVault(cards, picked))}>{v4("mztBulkStore")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkPlateIvory(cards, picked))}>{v4("mztBulkIvory")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkPlateTag(cards, picked))}>{v4("mztBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("mezzotint.csv", plateCsv(shown, station))}>{v4("mztCsv")}</button>
        <p className="c4-mezzotint-meta">{v4("mztKeys")} / c x a j k · {v4("mztQuiet")} {counts.quiet} · {v4("mztWarm")} {counts.warm}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-mezzotint-time" aria-label={v4("mztTimeline")}>
          {timeline.map((row) => <li key={row.depth}><span>{row.depth}</span> {row.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("mztEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-mezzotint-list">
          {shown.map((card) => {
            const late = latePlate(card, station);
            return (
              <li key={card.id} className="c4-mezzotint-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idlePlate(card) ? "1" : "0"} data-brisk={briskPlate(card) ? "1" : "0"} data-overdue={overduePlate(card) ? "1" : "0"} data-resting={restingPlate(card) ? "1" : "0"} data-warm={rockerWarm(card.tool) ? "1" : "0"} data-cool={rockerCool(card.tool) ? "1" : "0"} data-quiet={graphiteQuiet(card.ground) ? "1" : "0"}>
                <label className="c4-mezzotint-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editPlate(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("mztEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("mztApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editPlateNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("mztNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-mezzotint-meta">{toolLabel(v4, card.tool)} · {groundLabel(v4, card.ground)} · {card.depth ?? "—"} · {card.coat} · {card.hand || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "mztAuditSave")}` : ""}{late ? ` · ${v4("mztOverdue")}` : ""}</p>
                </div>
                <div className="c4-mezzotint-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("mztEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setPlateRaised(cards, card.id, !card.raised))}>{card.raised ? v4("mztFree") : v4("mztRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setPlateGround(cards, card.id, suggestedGround))}>{v4("mztSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setPlateRack(cards, card.id, !card.trayed))}>{card.trayed ? v4("mztUntray") : v4("mztTrayIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setPlateVault(cards, card.id, !card.stored))}>{card.stored ? v4("mztUnstore") : v4("mztStoreIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setPlateStar(cards, card.id, !card.starred))}>{card.starred ? v4("mztUnstar") : v4("mztStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addPlateTag(cards, card.id, "m"))}>{v4("mztTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseDayFocused(cards, card.id))}>{v4("mztRaiseDepth")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerDayFocused(cards, card.id))}>{v4("mztLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseFilmFocused(cards, card.id))}>{v4("mztCoat")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerFilmFocused(cards, card.id))}>{v4("mztCoat")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(groundFocused(cards, card.id))}>{v4("mztGround")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setPlateFocused(cards, card.id))}>{v4("mztRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(rackPlateFocused(cards, card.id))}>{v4("mztTray")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinPlateFocused(cards, card.id))}>{v4("mztStar")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(plateCopy(card))}>{v4("mztCopy")}</button>
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

export function MaculatureProofs({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: CapUser[] }>("/api/admin/users?take=24&meta=0");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<MacShape>("all");
  const [review, setReview] = useState<MacReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): MacRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      userId: id,
      code: { retentionStatus: textField(row.retentionStatus) } satisfies MacValue,
    };
  }).filter((row): row is MacRow => Boolean(row));
  const present = presentMacLanes(rows);
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
    const next = readHiddenMac(readJson(MAC_HIDE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(MAC_HIDE_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedMac(readJson(MAC_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(MAC_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleMacLanes(present, hidden, showHidden);
  const shown = visibleMac(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = macLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = macLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingMac(rows);
  const leadHue = leadingMacHue(rows);
  const whole = rows.filter((row) => macLane(row.code)).length;
  const share = macShare(laneMacCount(rows, "firm"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("maculature-lanes.csv", macLanesCsv(rows));
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
    writeJson(MAC_HIDE_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(MAC_REVIEW_KEY, next);
  }

  return (
    <section className="c4-maculature" aria-label={v4("macTitle")} data-proofs="1" data-role={role} data-names="1">
      <header className="c4-maculature-mast">
        <p className="c4-maculature-seal" data-logo="mono">{v4("macLogo")}</p>
        <div>
          <p className="c4-maculature-kicker">{v4("macSub")}</p>
          <h2 className="c4-title">{v4("macTitle")}</h2>
        </div>
        <p className="c4-maculature-count">{shown.length}</p>
      </header>
      <p className="c4-maculature-links">
        <Link href={crmv4Href(base, "mzt")}>{v4("mztTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("macCustomer")}</Link>
      </p>
      <p className="c4-maculature-hint">{v4("macHint")}</p>
      {viewer && <p className="c4-maculature-note">{v4("macViewer")}</p>}
      {queue.loading && <p className="c4-maculature-meta">{v4("macLoading")}</p>}
      {queue.error && <p className="c4-maculature-meta">{v4("macFailed")}</p>}
      <p className="c4-maculature-meta">{v4("macLead")} {laneLabel(v4, lead)} · {v4("macToneLead")} {hueLabel(v4, leadHue)} · {v4("macShare")} {share}</p>
      <div className="c4-maculature-chart" aria-label={v4("macChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-maculature-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ height: `${Math.max(12, Math.round((line.count / peak) * 72))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-maculature-tools">
        <input ref={searchRef} className="c4-field c4-maculature-search" aria-label={v4("macSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("macSearch")} />
        <label className="c4-lab">{v4("macChart")}<select className="c4-field" aria-label={v4("macChart")} value={shape} onChange={(event) => setShape(event.target.value as MacShape)}>{(Object.keys(SHAPE_KEY) as MacShape[]).map((item) => <option key={item} value={item}>{v4(SHAPE_KEY[item])}</option>)}</select></label>
        <button type="button" className="c4-chip" data-on={hue === "gilt" ? "1" : "0"} onClick={() => setHue(hue === "gilt" ? "all" : "gilt")}>{v4("macGilt")}</button>
        <button type="button" className="c4-chip" data-on={hue === "pearl" ? "1" : "0"} onClick={() => setHue(hue === "pearl" ? "all" : "pearl")}>{v4("macPearl")}</button>
        <button type="button" className="c4-chip" data-on={hue === "ink" ? "1" : "0"} onClick={() => setHue(hue === "ink" ? "all" : "ink")}>{v4("macInk")}</button>
        <button type="button" className="c4-chip" data-on={review === "fresh" ? "1" : "0"} onClick={() => setReview(review === "fresh" ? "all" : "fresh")}>{v4("macFresh")}</button>
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview(review === "reviewed" ? "all" : "reviewed")}>{v4("macReviewed")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{v4("macShow")}</button>
        {present.map((lane) => (
          <button key={lane} type="button" className="c4-chip" data-on={hidden.includes(lane) ? "1" : "0"} onClick={() => storeHidden(toggleMac(hidden, lane))}>{v4("macHide")} {laneLabel(v4, lane)}</button>
        ))}
      </div>
      <div className="c4-maculature-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkMacReview(reviewed, picked, true))}>{v4("macBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkMacReview(reviewed, picked, false))}>{v4("macBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("maculature-status.csv", macRowsCsv(shown, reviewed))}>{v4("macRowCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("maculature-lanes.csv", macLanesCsv(rows))}>{v4("macCsv")}</button>
      </div>
      {!shown.length && !queue.loading && <p className="c4-pay-empty">{v4("macEmpty")}</p>}
      <ul className="c4-maculature-list">
        {shown.map((row) => {
          const tone = macHue(row.code);
          const name = macCopy(row.code);
          return (
            <li key={row.id} className="c4-maculature-card" data-mail={macLane(row.code) || "open"} data-hue={tone || "none"} data-home={macLane(row.code) === "firm" ? "1" : "0"} data-away={macHush(row.code) ? "1" : "0"} data-hold={macSoon(row.code) ? "1" : "0"} data-guest={macLost(row.code) ? "1" : "0"} data-open={macOpen(row.code) ? "1" : "0"} data-even={macEven(row.code) ? "1" : "0"} data-digit={macDigit(row.code) ? "1" : "0"} data-letter={macLetter(row.code) ? "1" : "0"} data-mixed={macMixed(row.code) ? "1" : "0"} data-upper={macUpper(row.code) ? "1" : "0"} data-lower={macLower(row.code) ? "1" : "0"} data-space={macSpace(row.code) ? "1" : "0"} data-vowel={macVowel(row.code) ? "1" : "0"} data-tail={macTail(row.code) ? "1" : "0"} data-first={macFirst(row.code) ? "1" : "0"} data-held={macHeld(row.code) ? "1" : "0"} data-join={macPair(row.code) ? "1" : "0"} data-route={macRoute(row.code) ? "1" : "0"} data-brief={macShort(row.code) ? "1" : "0"} data-span={macLongLane(row.code) ? "1" : "0"} data-bare={macBare(row.code) ? "1" : "0"} data-line={macKeep(row.code) ? "1" : "0"} data-desk={macCool(row.code) ? "1" : "0"} data-tally={macTallyLane(row.code) ? "1" : "0"} data-vowel-lane={macVowelLane(row.code) ? "1" : "0"}>
              <label className="c4-maculature-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-maculature-meta">{name || v4("macOpen")} · {macStamp(row.code) || "—"} · {macFamily(row.code) || "—"} · {macLength(row.code) ?? "—"} · {laneLabel(v4, macLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-maculature-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleMacReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("macReviewed") : v4("macReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { navigator.clipboard?.writeText(macCopy(row.code)); setCopied(row.id); }}>{copied === row.id ? v4("macCopied") : v4("macCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.userId || row.id}`)}>{v4("macCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
