"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  LMP_HIDE_KEY,
  LMP_REVIEW_KEY,
  CSM_DENSITY_KEY,
  CSM_KEY,
  CSM_STONES,
  CSM_VIEW_KEY,
  addCosmati,
  addCosmatiTag,
  addCosmatiView,
  briskCosmati,
  bulkLampReview,
  bulkCosmatiIvory,
  bulkCosmatiLift,
  bulkCosmatiTag,
  bulkCosmatiVault,
  busiestHand,
  dropCosmatiView,
  editCosmati,
  editCosmatiNote,
  fairHand,
  lampBlank,
  lampCopy,
  lampDigit,
  lampLit,
  lampEven,
  lampFar,
  lampDim,
  lampHue,
  lampLane,
  lampLanes,
  lampLanesCsv,
  lampFade,
  lampLength,
  lampLetter,
  lampDark,
  lampOpen,
  lampRowsCsv,
  lampShare,
  lampNear,
  lampStamp,
  lampUpper,
  ivoryQuiet,
  groundFocused,
  idleCosmati,
  laneLampCount,
  lateCosmati,
  leadingLamp,
  leadingLampHue,
  lowerCourseFocused,
  lowerHourFocused,
  moveCosmatiFocus,
  overdueCosmati,
  pinCosmatiFocused,
  presentLampLanes,
  rackCosmatiFocused,
  raiseCourseFocused,
  raiseHourFocused,
  readHiddenLamp,
  readReviewedLamp,
  readCosmatiViews,
  readCosmatiList,
  reminderCosmatiList,
  restingCosmati,
  setCosmatiFocused,
  setCosmatiGround,
  setCosmatiPin,
  setCosmatiRack,
  setCosmatiRaised,
  setCosmatiVault,
  sortCosmatiList,
  stoneCool,
  stoneWarm,
  suggestStone,
  suggestCosmatiGround,
  suggestCosmatiHour,
  cosmatiBars,
  cosmatiCopy,
  cosmatiCounts,
  cosmatiCsv,
  cosmatiDensity,
  cosmatiHands,
  cosmatiTimeline,
  toggleLamp,
  toggleLampReview,
  visibleLamp,
  visibleLampLanes,
  visibleCosmatiList,
  type LampReview,
  type LampRow,
  type LampShape,
  type LampValue,
  type Cosmati,
  type CosmatiDensity,
  type CosmatiRack,
  type CosmatiSort,
  type CosmatiView,
} from "@/lib/crmv4/round387";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const GROUNDS = ["IVORY", "GRAPHITE", "CHAMPAGNE"] as const;
const HOURS = ["6", "9", "12", "15"] as const;
const COURSES = ["1", "3", "5"] as const;

const STONE_KEY: Record<string, CrmV4CopyKey> = {
  porphyry: "csmPorphyry",
  marble: "csmMarble",
  serpent: "csmSerpent",
  slate: "csmSlate",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "csmAuditSave",
  edit: "csmAuditEdit",
  note: "csmAuditNote",
  ground: "csmAuditGround",
  raise: "csmAuditRaise",
  free: "csmAuditFree",
  tray: "csmAuditTray",
  return: "csmAuditReturn",
  vault: "csmAuditVault",
  open: "csmAuditOpen",
  tag: "csmAuditTag",
  course: "csmAuditCourse",
  hour: "csmAuditHour",
  lower: "csmAuditLower",
  pin: "csmAuditPin",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  due: "plmLaneDue",
  soon: "plmLaneSoon",
  far: "plmLaneFar",
  late: "plmLaneLate",
  missed: "plmLaneMissed",
  hold: "plmLaneHold",
  blank: "plmLaneBlank",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  gilt: "plmGilt",
  pearl: "plmPearl",
  ink: "plmInk",
};

const SHAPE_KEY: Record<LampShape, CrmV4CopyKey> = {
  all: "plmShapeAll",
  due: "plmShapeDue",
  soon: "plmShapeSoon",
  far: "plmShapeFar",
  late: "plmShapeLate",
  missed: "plmShapeMissed",
  hold: "plmShapeHold",
  blank: "plmShapeBlank",
  open: "plmShapeOpen",
  digit: "plmShapeDigit",
  letter: "plmShapeLetter",
  even: "plmShapeEven",
  upper: "plmShapeUpper",
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

function stoneLabel(v4: V4, metal: string): string {
  const key = STONE_KEY[metal];
  return key ? v4(key) : v4("csmBlankStone");
}

function groundLabel(v4: V4, ground: string): string {
  if (ground === "IVORY") return v4("csmIvory");
  if (ground === "GRAPHITE") return v4("csmGraphite");
  if (ground === "CHAMPAGNE") return v4("csmChampagne");
  return v4("csmAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("plmBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("plmBlank");
}

export function CosmatiBands({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Cosmati[]>([]);
  const [views, setViews] = useState<CosmatiView[]>([]);
  const [density, setDensity] = useState<CosmatiDensity>("open");
  const [rack, setRack] = useState<CosmatiRack>("bench");
  const [query, setQuery] = useState("");
  const [handFilter, setHandFilter] = useState("");
  const [groundFilter, setGroundFilter] = useState("all");
  const [stoneFilter, setStoneFilter] = useState("all");
  const [hourFilter, setHourFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");
  const [sort, setSort] = useState<CosmatiSort>("stone");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [hand, setHand] = useState("");
  const [stone, setStone] = useState("");
  const [ground, setGround] = useState("");
  const [hourNo, setHourNo] = useState("");
  const [coatNo, setCoatNo] = useState("");
  const [tags, setTags] = useState("");
  const [viewName, setViewName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focusAt, setFocusAt] = useState(0);
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteId, setNoteId] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [station, setStation] = useState("porphyry");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readCosmatiList(readJson(CSM_KEY, [])));
    setViews(readCosmatiViews(readJson(CSM_VIEW_KEY, [])));
    setDensity(cosmatiDensity(readJson(CSM_DENSITY_KEY, "open")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Cosmati[]) {
    setCards(next);
    writeJson(CSM_KEY, next);
  }
  function storeViews(next: CosmatiView[]) {
    setViews(next);
    writeJson(CSM_VIEW_KEY, next);
  }
  function storeDensity(next: CosmatiDensity) {
    setDensity(next);
    writeJson(CSM_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortCosmatiList(visibleCosmatiList(cards, rack, query, handFilter, groundFilter, stoneFilter, hourFilter, courseFilter), sort),
    [cards, rack, query, handFilter, groundFilter, stoneFilter, hourFilter, courseFilter, sort],
  );
  const counts = cosmatiCounts(cards, shown, station);
  const bars = cosmatiBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = cosmatiTimeline(cards);
  const reminders = reminderCosmatiList(cards);
  const hands = cosmatiHands(cards);
  const busy = busiestHand(cards);
  const fair = fairHand(cards, hands.join(","));
  const suggestedGround = suggestCosmatiGround(cards);
  const suggestedHour = suggestCosmatiHour(cards, clock);
  const suggestedMetal = suggestStone(clock);
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
        download("cosmati.csv", cosmatiCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveCosmatiFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveCosmatiFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addCosmati(cards, { title, note, hand, stone, hour: hourNo, ground, course: coatNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-cosmati" aria-label={v4("csmTitle")} data-cosmati="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-cosmati-mast">
        <p className="c4-cosmati-seal" data-logo="mono">{v4("csmLogo")}</p>
        <div>
          <p className="c4-cosmati-kicker">{v4("csmSub")}</p>
          <h2 className="c4-title">{v4("csmTitle")}</h2>
        </div>
        <p className="c4-cosmati-count">{shown.length}</p>
      </header>
      <p className="c4-cosmati-links">
        <Link href={crmv4Href(base, "plm")}>{v4("plmTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("csmCustomers")}</Link>
      </p>
      <p className="c4-cosmati-hint">{v4("csmHint")}</p>
      {viewer && <p className="c4-cosmati-note">{v4("csmViewer")}</p>}
      <p className="c4-cosmati-meta">{v4("csmFair")} {fair || "—"} · {v4("csmBusy")} {busy || "—"} · {v4("csmSuggest")} {stoneLabel(v4, suggestedMetal)} · {groundLabel(v4, suggestedGround)} · {suggestedHour}</p>
      <ol className="c4-cosmati-index" aria-label={v4("csmRemind")}>
        <li data-tone="gold">{v4("csmOverdue")} {counts.overdue}</li>
        <li data-tone="ink">{v4("csmIdle")} {counts.idle}</li>
        <li data-tone="pearl">{v4("csmBrisk")} {counts.brisk}</li>
        <li data-tone="pearl">{v4("csmResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-cosmati-remind c4-cosmati-notices" role="status" aria-label={v4("csmRemind")}>
          {reminders.map((name) => <li key={name}>{v4("csmOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-cosmati-chart" aria-label={v4("csmChart")}>
        {bars.map((bar) => (
          <button key={bar.stone} type="button" className="c4-cosmati-column" data-on={stoneFilter === bar.stone ? "1" : "0"} onClick={() => setStoneFilter(stoneFilter === bar.stone ? "all" : bar.stone)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{stoneLabel(v4, bar.stone)}</span>
          </button>
        ))}
      </div>
      <form className="c4-cosmati-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("csmEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("csmEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("csmNote")}<input className="c4-field" aria-label={v4("csmNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("csmHand")}<input className="c4-field" aria-label={v4("csmHand")} aria-required={false} value={hand} maxLength={24} disabled={viewer} onChange={(event) => setHand(event.target.value)} /></label>
        <label className="c4-lab">{v4("csmStone")}<select className="c4-field" aria-label={v4("csmStone")} value={stone} disabled={viewer} onChange={(event) => setStone(event.target.value)}><option value="">{v4("csmBlankStone")}</option>{CSM_STONES.map((item) => <option key={item} value={item}>{stoneLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("csmGround")}<select className="c4-field" aria-label={v4("csmGround")} value={ground} disabled={viewer} onChange={(event) => setGround(event.target.value)}><option value="">{v4("csmAll")}</option>{GROUNDS.map((item) => <option key={item} value={item}>{groundLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("csmHour")}<select className="c4-field" aria-label={v4("csmHour")} value={hourNo} disabled={viewer} onChange={(event) => setHourNo(event.target.value)}><option value="">{v4("csmAll")}</option>{HOURS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("csmCourse")}<select className="c4-field" aria-label={v4("csmCourse")} value={coatNo} disabled={viewer} onChange={(event) => setCoatNo(event.target.value)}><option value="">{v4("csmAll")}</option>{COURSES.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("csmTag")}<input className="c4-field" aria-label={v4("csmTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("csmAdd")}</button>
      </form>
      <div className="c4-cosmati-tools">
        <input ref={searchRef} className="c4-field c4-cosmati-search" aria-label={v4("csmSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("csmSearch")} />
        {(["bench", "tray", "vault"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={rack === item ? "1" : "0"} onClick={() => setRack(item)}>{v4(item === "bench" ? "csmBench" : item === "tray" ? "csmTray" : "csmVault")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={stoneFilter === "warm" ? "1" : "0"} onClick={() => setStoneFilter(stoneFilter === "warm" ? "all" : "warm")}>{v4("csmWarm")}</button>
        <button type="button" className="c4-chip" data-on={stoneFilter === "cool" ? "1" : "0"} onClick={() => setStoneFilter(stoneFilter === "cool" ? "all" : "cool")}>{v4("csmCool")}</button>
        {GROUNDS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={groundFilter === item ? "1" : "0"} onClick={() => setGroundFilter(groundFilter === item ? "all" : item)}>{groundLabel(v4, item)}</button>
        ))}
        {HOURS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hourFilter === item ? "1" : "0"} onClick={() => setHourFilter(hourFilter === item ? "all" : item)}>{item}</button>
        ))}
        {COURSES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={courseFilter === item ? "1" : "0"} onClick={() => setCourseFilter(courseFilter === item ? "all" : item)}>{item}</button>
        ))}
        {hands.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={handFilter === name ? "1" : "0"} onClick={() => setHandFilter(handFilter === name ? "" : name)}>{name}</button>
        ))}
        <button type="button" className="c4-chip" data-on={sort === "hand" ? "1" : "0"} onClick={() => setSort(sort === "hand" ? "stone" : "hand")}>{sort === "hand" ? v4("csmSortHand") : v4("csmSortStone")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "open" : "tight")}>{density === "tight" ? v4("csmTight") : v4("csmOpenDensity")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("csmTimeline")}</button>
        <label className="c4-lab">{v4("csmDesk")}<select className="c4-field" aria-label={v4("csmDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{CSM_STONES.map((item) => <option key={item} value={item}>{stoneLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-cosmati-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addCosmatiView(views, { id, name: viewName, rack, query, hand: handFilter, ground: groundFilter, stone: stoneFilter, hour: hourFilter, course: courseFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("csmViewName")}<input className="c4-field" aria-label={v4("csmViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("csmSaveView")}</button>
      </form>
      <ul className="c4-cosmati-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setRack(view.rack); setQuery(view.query); setHandFilter(view.hand); setGroundFilter(view.ground); setStoneFilter(view.stone); setHourFilter(view.hour); setCourseFilter(view.course); }}>{v4("csmApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropCosmatiView(views, view.id))}>{v4("csmDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-cosmati-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCosmatiLift(cards, picked))}>{v4("csmBulkRaise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCosmatiVault(cards, picked))}>{v4("csmBulkVault")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCosmatiIvory(cards, picked))}>{v4("csmBulkIvory")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCosmatiTag(cards, picked))}>{v4("csmBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("cosmati.csv", cosmatiCsv(shown, station))}>{v4("csmCsv")}</button>
        <p className="c4-cosmati-meta">{v4("csmKeys")} / c x a j k · {v4("csmQuiet")} {counts.quiet} · {v4("csmWarm")} {counts.warm}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-cosmati-time" aria-label={v4("csmTimeline")}>
          {timeline.map((row) => <li key={row.hour}><span>{row.hour}</span> {row.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("csmEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-cosmati-list">
          {shown.map((card) => {
            const late = lateCosmati(card, station);
            return (
              <li key={card.id} className="c4-cosmati-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleCosmati(card) ? "1" : "0"} data-brisk={briskCosmati(card) ? "1" : "0"} data-overdue={overdueCosmati(card) ? "1" : "0"} data-resting={restingCosmati(card) ? "1" : "0"} data-warm={stoneWarm(card.stone) ? "1" : "0"} data-cool={stoneCool(card.stone) ? "1" : "0"} data-quiet={ivoryQuiet(card.ground) ? "1" : "0"}>
                <label className="c4-cosmati-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editCosmati(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("csmEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("csmApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editCosmatiNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("csmNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-cosmati-meta">{stoneLabel(v4, card.stone)} · {groundLabel(v4, card.ground)} · {card.hour ?? "—"} · {card.course} · {card.hand || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "csmAuditSave")}` : ""}{late ? ` · ${v4("csmOverdue")}` : ""}</p>
                </div>
                <div className="c4-cosmati-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("csmEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCosmatiRaised(cards, card.id, !card.raised))}>{card.raised ? v4("csmFree") : v4("csmRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCosmatiGround(cards, card.id, suggestedGround))}>{v4("csmSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCosmatiRack(cards, card.id, !card.trayed))}>{card.trayed ? v4("csmUntray") : v4("csmTrayIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCosmatiVault(cards, card.id, !card.vaulted))}>{card.vaulted ? v4("csmUnvault") : v4("csmVaultIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCosmatiPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("csmUnpin") : v4("csmPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addCosmatiTag(cards, card.id, "p"))}>{v4("csmTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHourFocused(cards, card.id))}>{v4("csmRaiseHour")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHourFocused(cards, card.id))}>{v4("csmLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseCourseFocused(cards, card.id))}>{v4("csmCourse")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerCourseFocused(cards, card.id))}>{v4("csmCourse")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(groundFocused(cards, card.id))}>{v4("csmGround")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCosmatiFocused(cards, card.id))}>{v4("csmRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(rackCosmatiFocused(cards, card.id))}>{v4("csmTray")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinCosmatiFocused(cards, card.id))}>{v4("csmPin")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(cosmatiCopy(card))}>{v4("csmCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type CapUser = { id?: string; name?: string | null; active?: string | null };

export function PresenceLamps({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: CapUser[] }>("/api/admin/users?take=24&meta=0");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<LampShape>("all");
  const [review, setReview] = useState<LampReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): LampRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      userId: id,
      code: { active: textField(row.active) } satisfies LampValue,
    };
  }).filter((row): row is LampRow => Boolean(row));
  const present = presentLampLanes(rows);
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
    const next = readHiddenLamp(readJson(LMP_HIDE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(LMP_HIDE_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedLamp(readJson(LMP_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(LMP_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleLampLanes(present, hidden, showHidden);
  const shown = visibleLamp(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = lampLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = lampLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingLamp(rows);
  const leadHue = leadingLampHue(rows);
  const whole = rows.filter((row) => lampLane(row.code)).length;
  const share = lampShare(laneLampCount(rows, "due"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("presence-lanes.csv", lampLanesCsv(rows));
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
    writeJson(LMP_HIDE_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(LMP_REVIEW_KEY, next);
  }

  return (
    <section className="c4-presence" aria-label={v4("plmTitle")} data-presence="1" data-role={role} data-names="1">
      <header className="c4-presence-mast">
        <p className="c4-presence-seal" data-logo="mono">{v4("plmLogo")}</p>
        <div>
          <p className="c4-presence-kicker">{v4("plmSub")}</p>
          <h2 className="c4-title">{v4("plmTitle")}</h2>
        </div>
        <p className="c4-presence-count">{shown.length}</p>
      </header>
      <p className="c4-presence-links">
        <Link href={crmv4Href(base, "csm")}>{v4("csmTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("plmCustomer")}</Link>
      </p>
      <p className="c4-presence-hint">{v4("plmHint")}</p>
      {viewer && <p className="c4-presence-note">{v4("plmViewer")}</p>}
      {queue.loading && <p className="c4-presence-meta">{v4("plmLoading")}</p>}
      {queue.error && <p className="c4-presence-meta">{v4("plmFailed")}</p>}
      <p className="c4-presence-meta">{v4("plmLead")} {laneLabel(v4, lead)} · {v4("plmToneLead")} {hueLabel(v4, leadHue)} · {v4("plmShare")} {share}</p>
      <div className="c4-presence-chart" aria-label={v4("plmChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-presence-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ height: `${Math.max(12, Math.round((line.count / peak) * 72))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-presence-tools">
        <input ref={searchRef} className="c4-field c4-presence-search" aria-label={v4("plmSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("plmSearch")} />
        <label className="c4-lab">{v4("plmChart")}<select className="c4-field" aria-label={v4("plmChart")} value={shape} onChange={(event) => setShape(event.target.value as LampShape)}>{(Object.keys(SHAPE_KEY) as LampShape[]).map((item) => <option key={item} value={item}>{v4(SHAPE_KEY[item])}</option>)}</select></label>
        <button type="button" className="c4-chip" data-on={hue === "gilt" ? "1" : "0"} onClick={() => setHue(hue === "gilt" ? "all" : "gilt")}>{v4("plmGilt")}</button>
        <button type="button" className="c4-chip" data-on={hue === "pearl" ? "1" : "0"} onClick={() => setHue(hue === "pearl" ? "all" : "pearl")}>{v4("plmPearl")}</button>
        <button type="button" className="c4-chip" data-on={hue === "ink" ? "1" : "0"} onClick={() => setHue(hue === "ink" ? "all" : "ink")}>{v4("plmInk")}</button>
        <button type="button" className="c4-chip" data-on={review === "fresh" ? "1" : "0"} onClick={() => setReview(review === "fresh" ? "all" : "fresh")}>{v4("plmFresh")}</button>
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview(review === "reviewed" ? "all" : "reviewed")}>{v4("plmReviewed")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{v4("plmShow")}</button>
        {present.map((lane) => (
          <button key={lane} type="button" className="c4-chip" data-on={hidden.includes(lane) ? "1" : "0"} onClick={() => storeHidden(toggleLamp(hidden, lane))}>{v4("plmHide")} {laneLabel(v4, lane)}</button>
        ))}
      </div>
      <div className="c4-presence-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkLampReview(reviewed, picked, true))}>{v4("plmBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkLampReview(reviewed, picked, false))}>{v4("plmBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("presence-status.csv", lampRowsCsv(shown, reviewed))}>{v4("plmRowCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("presence-lanes.csv", lampLanesCsv(rows))}>{v4("plmCsv")}</button>
      </div>
      {!shown.length && !queue.loading && <p className="c4-pay-empty">{v4("plmEmpty")}</p>}
      <ul className="c4-presence-list">
        {shown.map((row) => {
          const tone = lampHue(row.code);
          const name = lampCopy(row.code);
          return (
            <li key={row.id} className="c4-presence-card" data-mail={lampLane(row.code) || "open"} data-hue={tone || "none"} data-lit={lampLit(row.code) ? "1" : "0"} data-near={lampNear(row.code) ? "1" : "0"} data-far={lampFar(row.code) ? "1" : "0"} data-fade={lampFade(row.code) ? "1" : "0"} data-dark={lampDark(row.code) ? "1" : "0"} data-dim={lampDim(row.code) ? "1" : "0"} data-blank={lampBlank(row.code) ? "1" : "0"} data-open={lampOpen(row.code) ? "1" : "0"} data-even={lampEven(row.code) ? "1" : "0"} data-digit={lampDigit(row.code) ? "1" : "0"} data-letter={lampLetter(row.code) ? "1" : "0"} data-upper={lampUpper(row.code) ? "1" : "0"}>
              <label className="c4-presence-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-presence-meta">{name || v4("plmOpen")} · {lampStamp(row.code) || "—"} · {lampLength(row.code) ?? "—"} · {laneLabel(v4, lampLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-presence-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleLampReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("plmReviewed") : v4("plmReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { navigator.clipboard?.writeText(lampCopy(row.code)); setCopied(row.id); }}>{copied === row.id ? v4("plmCopied") : v4("plmCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.userId || row.id}`)}>{v4("plmCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
