"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  SLD_HIDE_KEY,
  SLD_REVIEW_KEY,
  GIO_DENSITY_KEY,
  GIO_KEY,
  GIO_PIGMENTS,
  GIO_VIEW_KEY,
  addGiornata,
  addGiornataTag,
  addGiornataView,
  briskGiornata,
  bulkDialReview,
  bulkGiornataIvory,
  bulkGiornataLift,
  bulkGiornataTag,
  bulkGiornataArchive,
  busiestHand,
  dropGiornataView,
  editGiornata,
  editGiornataNote,
  fairHand,
  dialBlank,
  dialCopy,
  dialDigit,
  dialLit,
  dialEven,
  dialFar,
  dialDim,
  dialHue,
  dialLane,
  dialLanes,
  dialLanesCsv,
  dialFade,
  dialLength,
  dialLetter,
  dialDark,
  dialOpen,
  dialRowsCsv,
  dialShare,
  dialNear,
  dialStamp,
  dialUpper,
  champagneQuiet,
  groundFocused,
  idleGiornata,
  laneDialCount,
  lateGiornata,
  leadingDial,
  leadingDialHue,
  lowerCourseFocused,
  lowerHourFocused,
  moveGiornataFocus,
  overdueGiornata,
  pinGiornataFocused,
  presentDialLanes,
  rackGiornataFocused,
  raiseCourseFocused,
  raiseHourFocused,
  readHiddenDial,
  readReviewedDial,
  readGiornataViews,
  readGiornataList,
  reminderGiornataList,
  restingGiornata,
  setGiornataFocused,
  setGiornataGround,
  setGiornataPin,
  setGiornataRack,
  setGiornataRaised,
  setGiornataArchive,
  sortGiornataList,
  pigmentCool,
  pigmentWarm,
  suggestPigment,
  suggestGiornataGround,
  suggestGiornataHour,
  giornataBars,
  giornataCopy,
  giornataCounts,
  giornataCsv,
  giornataDensity,
  giornataHands,
  giornataTimeline,
  toggleDial,
  toggleDialReview,
  visibleDial,
  visibleDialLanes,
  visibleGiornataList,
  type DialReview,
  type DialRow,
  type DialShape,
  type DialValue,
  type Giornata,
  type GiornataDensity,
  type GiornataRack,
  type GiornataSort,
  type GiornataView,
} from "@/lib/crmv4/round388";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const GROUNDS = ["IVORY", "GRAPHITE", "CHAMPAGNE"] as const;
const HOURS = ["3", "7", "11", "14"] as const;
const COURSES = ["2", "4", "8"] as const;

const STONE_KEY: Record<string, CrmV4CopyKey> = {
  lime: "gioLime",
  sand: "gioSand",
  umber: "gioUmber",
  soot: "gioSoot",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "gioAuditSave",
  edit: "gioAuditEdit",
  note: "gioAuditNote",
  ground: "gioAuditGround",
  raise: "gioAuditRaise",
  free: "gioAuditFree",
  scaffold: "gioAuditScaffold",
  return: "gioAuditReturn",
  archive: "gioAuditArchive",
  open: "gioAuditOpen",
  tag: "gioAuditTag",
  course: "gioAuditCourse",
  hour: "gioAuditHour",
  lower: "gioAuditLower",
  pin: "gioAuditPin",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  due: "sldLaneDue",
  soon: "sldLaneSoon",
  far: "sldLaneFar",
  late: "sldLaneLate",
  missed: "sldLaneMissed",
  hold: "sldLaneHold",
  blank: "sldLaneBlank",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  brass: "sldBrass",
  mist: "sldMist",
  pitch: "sldPitch",
};

const SHAPE_KEY: Record<DialShape, CrmV4CopyKey> = {
  all: "sldShapeAll",
  due: "sldShapeDue",
  soon: "sldShapeSoon",
  far: "sldShapeFar",
  late: "sldShapeLate",
  missed: "sldShapeMissed",
  hold: "sldShapeHold",
  blank: "sldShapeBlank",
  open: "sldShapeOpen",
  digit: "sldShapeDigit",
  letter: "sldShapeLetter",
  even: "sldShapeEven",
  upper: "sldShapeUpper",
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

function pigmentLabel(v4: V4, metal: string): string {
  const key = STONE_KEY[metal];
  return key ? v4(key) : v4("gioBlankPigment");
}

function groundLabel(v4: V4, ground: string): string {
  if (ground === "IVORY") return v4("gioIvory");
  if (ground === "GRAPHITE") return v4("gioGraphite");
  if (ground === "CHAMPAGNE") return v4("gioChampagne");
  return v4("gioAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("sldBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("sldBlank");
}

export function GiornataPatches({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Giornata[]>([]);
  const [views, setViews] = useState<GiornataView[]>([]);
  const [density, setDensity] = useState<GiornataDensity>("open");
  const [rack, setRack] = useState<GiornataRack>("wall");
  const [query, setQuery] = useState("");
  const [handFilter, setHandFilter] = useState("");
  const [groundFilter, setGroundFilter] = useState("all");
  const [pigmentFilter, setPigmentFilter] = useState("all");
  const [hourFilter, setHourFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");
  const [sort, setSort] = useState<GiornataSort>("pigment");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [hand, setHand] = useState("");
  const [pigment, setPigment] = useState("");
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
  const [station, setStation] = useState("lime");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readGiornataList(readJson(GIO_KEY, [])));
    setViews(readGiornataViews(readJson(GIO_VIEW_KEY, [])));
    setDensity(giornataDensity(readJson(GIO_DENSITY_KEY, "open")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Giornata[]) {
    setCards(next);
    writeJson(GIO_KEY, next);
  }
  function storeViews(next: GiornataView[]) {
    setViews(next);
    writeJson(GIO_VIEW_KEY, next);
  }
  function storeDensity(next: GiornataDensity) {
    setDensity(next);
    writeJson(GIO_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortGiornataList(visibleGiornataList(cards, rack, query, handFilter, groundFilter, pigmentFilter, hourFilter, courseFilter), sort),
    [cards, rack, query, handFilter, groundFilter, pigmentFilter, hourFilter, courseFilter, sort],
  );
  const counts = giornataCounts(cards, shown, station);
  const bars = giornataBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = giornataTimeline(cards);
  const reminders = reminderGiornataList(cards);
  const hands = giornataHands(cards);
  const busy = busiestHand(cards);
  const fair = fairHand(cards, hands.join(","));
  const suggestedGround = suggestGiornataGround(cards);
  const suggestedHour = suggestGiornataHour(cards, clock);
  const suggestedMetal = suggestPigment(clock);
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
        download("giornata.csv", giornataCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveGiornataFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveGiornataFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addGiornata(cards, { title, note, hand, pigment, hour: hourNo, ground, course: coatNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-giornata" aria-label={v4("gioTitle")} data-giornata="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-giornata-mast">
        <p className="c4-giornata-seal" data-logo="mono">{v4("gioLogo")}</p>
        <div>
          <p className="c4-giornata-kicker">{v4("gioSub")}</p>
          <h2 className="c4-title">{v4("gioTitle")}</h2>
        </div>
        <p className="c4-giornata-count">{shown.length}</p>
      </header>
      <p className="c4-giornata-links">
        <Link href={crmv4Href(base, "sld")}>{v4("sldTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("gioCustomers")}</Link>
      </p>
      <p className="c4-giornata-hint">{v4("gioHint")}</p>
      {viewer && <p className="c4-giornata-note">{v4("gioViewer")}</p>}
      <p className="c4-giornata-meta">{v4("gioFair")} {fair || "—"} · {v4("gioBusy")} {busy || "—"} · {v4("gioSuggest")} {pigmentLabel(v4, suggestedMetal)} · {groundLabel(v4, suggestedGround)} · {suggestedHour}</p>
      <ol className="c4-giornata-index" aria-label={v4("gioRemind")}>
        <li data-tone="gold">{v4("gioOverdue")} {counts.overdue}</li>
        <li data-tone="pitch">{v4("gioIdle")} {counts.idle}</li>
        <li data-tone="mist">{v4("gioBrisk")} {counts.brisk}</li>
        <li data-tone="mist">{v4("gioResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-giornata-remind c4-giornata-notices" role="status" aria-label={v4("gioRemind")}>
          {reminders.map((name) => <li key={name}>{v4("gioOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-giornata-chart" aria-label={v4("gioChart")}>
        {bars.map((bar) => (
          <button key={bar.pigment} type="button" className="c4-giornata-column" data-on={pigmentFilter === bar.pigment ? "1" : "0"} onClick={() => setPigmentFilter(pigmentFilter === bar.pigment ? "all" : bar.pigment)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{pigmentLabel(v4, bar.pigment)}</span>
          </button>
        ))}
      </div>
      <form className="c4-giornata-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("gioEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("gioEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("gioNote")}<input className="c4-field" aria-label={v4("gioNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("gioHand")}<input className="c4-field" aria-label={v4("gioHand")} aria-required={false} value={hand} maxLength={24} disabled={viewer} onChange={(event) => setHand(event.target.value)} /></label>
        <label className="c4-lab">{v4("gioPigment")}<select className="c4-field" aria-label={v4("gioPigment")} value={pigment} disabled={viewer} onChange={(event) => setPigment(event.target.value)}><option value="">{v4("gioBlankPigment")}</option>{GIO_PIGMENTS.map((item) => <option key={item} value={item}>{pigmentLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("gioGround")}<select className="c4-field" aria-label={v4("gioGround")} value={ground} disabled={viewer} onChange={(event) => setGround(event.target.value)}><option value="">{v4("gioAll")}</option>{GROUNDS.map((item) => <option key={item} value={item}>{groundLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("gioHour")}<select className="c4-field" aria-label={v4("gioHour")} value={hourNo} disabled={viewer} onChange={(event) => setHourNo(event.target.value)}><option value="">{v4("gioAll")}</option>{HOURS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("gioCourse")}<select className="c4-field" aria-label={v4("gioCourse")} value={coatNo} disabled={viewer} onChange={(event) => setCoatNo(event.target.value)}><option value="">{v4("gioAll")}</option>{COURSES.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("gioTag")}<input className="c4-field" aria-label={v4("gioTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("gioAdd")}</button>
      </form>
      <div className="c4-giornata-tools">
        <input ref={searchRef} className="c4-field c4-giornata-search" aria-label={v4("gioSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("gioSearch")} />
        {(["wall", "scaffold", "archive"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={rack === item ? "1" : "0"} onClick={() => setRack(item)}>{v4(item === "wall" ? "gioWall" : item === "scaffold" ? "gioScaffold" : "gioArchive")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={pigmentFilter === "warm" ? "1" : "0"} onClick={() => setPigmentFilter(pigmentFilter === "warm" ? "all" : "warm")}>{v4("gioWarm")}</button>
        <button type="button" className="c4-chip" data-on={pigmentFilter === "cool" ? "1" : "0"} onClick={() => setPigmentFilter(pigmentFilter === "cool" ? "all" : "cool")}>{v4("gioCool")}</button>
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
        <button type="button" className="c4-chip" data-on={sort === "hand" ? "1" : "0"} onClick={() => setSort(sort === "hand" ? "pigment" : "hand")}>{sort === "hand" ? v4("gioSortHand") : v4("gioSortPigment")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "open" : "tight")}>{density === "tight" ? v4("gioTight") : v4("gioOpenDensity")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("gioTimeline")}</button>
        <label className="c4-lab">{v4("gioDesk")}<select className="c4-field" aria-label={v4("gioDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{GIO_PIGMENTS.map((item) => <option key={item} value={item}>{pigmentLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-giornata-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addGiornataView(views, { id, name: viewName, rack, query, hand: handFilter, ground: groundFilter, pigment: pigmentFilter, hour: hourFilter, course: courseFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("gioViewName")}<input className="c4-field" aria-label={v4("gioViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("gioSaveView")}</button>
      </form>
      <ul className="c4-giornata-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setRack(view.rack); setQuery(view.query); setHandFilter(view.hand); setGroundFilter(view.ground); setPigmentFilter(view.pigment); setHourFilter(view.hour); setCourseFilter(view.course); }}>{v4("gioApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropGiornataView(views, view.id))}>{v4("gioDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-giornata-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkGiornataLift(cards, picked))}>{v4("gioBulkRaise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkGiornataArchive(cards, picked))}>{v4("gioBulkArchive")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkGiornataIvory(cards, picked))}>{v4("gioBulkIvory")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkGiornataTag(cards, picked))}>{v4("gioBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("giornata.csv", giornataCsv(shown, station))}>{v4("gioCsv")}</button>
        <p className="c4-giornata-meta">{v4("gioKeys")} / c x a j k · {v4("gioQuiet")} {counts.quiet} · {v4("gioWarm")} {counts.warm}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-giornata-time" aria-label={v4("gioTimeline")}>
          {timeline.map((row) => <li key={row.hour}><span>{row.hour}</span> {row.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("gioEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-giornata-list">
          {shown.map((card) => {
            const late = lateGiornata(card, station);
            return (
              <li key={card.id} className="c4-giornata-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleGiornata(card) ? "1" : "0"} data-brisk={briskGiornata(card) ? "1" : "0"} data-overdue={overdueGiornata(card) ? "1" : "0"} data-resting={restingGiornata(card) ? "1" : "0"} data-warm={pigmentWarm(card.pigment) ? "1" : "0"} data-cool={pigmentCool(card.pigment) ? "1" : "0"} data-quiet={champagneQuiet(card.ground) ? "1" : "0"}>
                <label className="c4-giornata-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editGiornata(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("gioEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("gioApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editGiornataNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("gioNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-giornata-meta">{pigmentLabel(v4, card.pigment)} · {groundLabel(v4, card.ground)} · {card.hour ?? "—"} · {card.course} · {card.hand || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "gioAuditSave")}` : ""}{late ? ` · ${v4("gioOverdue")}` : ""}</p>
                </div>
                <div className="c4-giornata-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("gioEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setGiornataRaised(cards, card.id, !card.raised))}>{card.raised ? v4("gioFree") : v4("gioRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setGiornataGround(cards, card.id, suggestedGround))}>{v4("gioSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setGiornataRack(cards, card.id, !card.scaffolded))}>{card.scaffolded ? v4("gioUnscaffold") : v4("gioScaffoldIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setGiornataArchive(cards, card.id, !card.archived))}>{card.archived ? v4("gioUnarchive") : v4("gioArchiveIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setGiornataPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("gioUnpin") : v4("gioPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addGiornataTag(cards, card.id, "a"))}>{v4("gioTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHourFocused(cards, card.id))}>{v4("gioRaiseHour")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHourFocused(cards, card.id))}>{v4("gioLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseCourseFocused(cards, card.id))}>{v4("gioCourse")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerCourseFocused(cards, card.id))}>{v4("gioCourse")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(groundFocused(cards, card.id))}>{v4("gioGround")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setGiornataFocused(cards, card.id))}>{v4("gioRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(rackGiornataFocused(cards, card.id))}>{v4("gioScaffold")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinGiornataFocused(cards, card.id))}>{v4("gioPin")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(giornataCopy(card))}>{v4("gioCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type CapUser = { id?: string; name?: string | null; lastContactAt?: string | null };

export function SilenceDials({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: CapUser[] }>("/api/admin/users?take=24&meta=0");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<DialShape>("all");
  const [review, setReview] = useState<DialReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): DialRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      userId: id,
      code: { contact: textField(row.lastContactAt) } satisfies DialValue,
    };
  }).filter((row): row is DialRow => Boolean(row));
  const present = presentDialLanes(rows);
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
    const next = readHiddenDial(readJson(SLD_HIDE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(SLD_HIDE_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedDial(readJson(SLD_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(SLD_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleDialLanes(present, hidden, showHidden);
  const shown = visibleDial(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = dialLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = dialLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingDial(rows);
  const leadHue = leadingDialHue(rows);
  const whole = rows.filter((row) => dialLane(row.code)).length;
  const share = dialShare(laneDialCount(rows, "due"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("silence-lanes.csv", dialLanesCsv(rows));
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
    writeJson(SLD_HIDE_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(SLD_REVIEW_KEY, next);
  }

  return (
    <section className="c4-silence" aria-label={v4("sldTitle")} data-silence="1" data-role={role} data-names="1">
      <header className="c4-silence-mast">
        <p className="c4-silence-seal" data-logo="mono">{v4("sldLogo")}</p>
        <div>
          <p className="c4-silence-kicker">{v4("sldSub")}</p>
          <h2 className="c4-title">{v4("sldTitle")}</h2>
        </div>
        <p className="c4-silence-count">{shown.length}</p>
      </header>
      <p className="c4-silence-links">
        <Link href={crmv4Href(base, "gio")}>{v4("gioTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("sldCustomer")}</Link>
      </p>
      <p className="c4-silence-hint">{v4("sldHint")}</p>
      {viewer && <p className="c4-silence-note">{v4("sldViewer")}</p>}
      {queue.loading && <p className="c4-silence-meta">{v4("sldLoading")}</p>}
      {queue.error && <p className="c4-silence-meta">{v4("sldFailed")}</p>}
      <p className="c4-silence-meta">{v4("sldLead")} {laneLabel(v4, lead)} · {v4("sldToneLead")} {hueLabel(v4, leadHue)} · {v4("sldShare")} {share}</p>
      <div className="c4-silence-chart" aria-label={v4("sldChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-silence-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ height: `${Math.max(12, Math.round((line.count / peak) * 72))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-silence-tools">
        <input ref={searchRef} className="c4-field c4-silence-search" aria-label={v4("sldSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("sldSearch")} />
        <label className="c4-lab">{v4("sldChart")}<select className="c4-field" aria-label={v4("sldChart")} value={shape} onChange={(event) => setShape(event.target.value as DialShape)}>{(Object.keys(SHAPE_KEY) as DialShape[]).map((item) => <option key={item} value={item}>{v4(SHAPE_KEY[item])}</option>)}</select></label>
        <button type="button" className="c4-chip" data-on={hue === "brass" ? "1" : "0"} onClick={() => setHue(hue === "brass" ? "all" : "brass")}>{v4("sldBrass")}</button>
        <button type="button" className="c4-chip" data-on={hue === "mist" ? "1" : "0"} onClick={() => setHue(hue === "mist" ? "all" : "mist")}>{v4("sldMist")}</button>
        <button type="button" className="c4-chip" data-on={hue === "pitch" ? "1" : "0"} onClick={() => setHue(hue === "pitch" ? "all" : "pitch")}>{v4("sldPitch")}</button>
        <button type="button" className="c4-chip" data-on={review === "fresh" ? "1" : "0"} onClick={() => setReview(review === "fresh" ? "all" : "fresh")}>{v4("sldFresh")}</button>
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview(review === "reviewed" ? "all" : "reviewed")}>{v4("sldReviewed")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{v4("sldShow")}</button>
        {present.map((lane) => (
          <button key={lane} type="button" className="c4-chip" data-on={hidden.includes(lane) ? "1" : "0"} onClick={() => storeHidden(toggleDial(hidden, lane))}>{v4("sldHide")} {laneLabel(v4, lane)}</button>
        ))}
      </div>
      <div className="c4-silence-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkDialReview(reviewed, picked, true))}>{v4("sldBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkDialReview(reviewed, picked, false))}>{v4("sldBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("silence-status.csv", dialRowsCsv(shown, reviewed))}>{v4("sldRowCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("silence-lanes.csv", dialLanesCsv(rows))}>{v4("sldCsv")}</button>
      </div>
      {!shown.length && !queue.loading && <p className="c4-pay-empty">{v4("sldEmpty")}</p>}
      <ul className="c4-silence-list">
        {shown.map((row) => {
          const tone = dialHue(row.code);
          const name = dialCopy(row.code);
          return (
            <li key={row.id} className="c4-silence-card" data-mail={dialLane(row.code) || "open"} data-hue={tone || "none"} data-lit={dialLit(row.code) ? "1" : "0"} data-near={dialNear(row.code) ? "1" : "0"} data-far={dialFar(row.code) ? "1" : "0"} data-fade={dialFade(row.code) ? "1" : "0"} data-dark={dialDark(row.code) ? "1" : "0"} data-dim={dialDim(row.code) ? "1" : "0"} data-blank={dialBlank(row.code) ? "1" : "0"} data-open={dialOpen(row.code) ? "1" : "0"} data-even={dialEven(row.code) ? "1" : "0"} data-digit={dialDigit(row.code) ? "1" : "0"} data-letter={dialLetter(row.code) ? "1" : "0"} data-upper={dialUpper(row.code) ? "1" : "0"}>
              <label className="c4-silence-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-silence-meta">{name || v4("sldOpen")} · {dialStamp(row.code) || "—"} · {dialLength(row.code) ?? "—"} · {laneLabel(v4, dialLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-silence-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleDialReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("sldReviewed") : v4("sldReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { navigator.clipboard?.writeText(dialCopy(row.code)); setCopied(row.id); }}>{copied === row.id ? v4("sldCopied") : v4("sldCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.userId || row.id}`)}>{v4("sldCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
