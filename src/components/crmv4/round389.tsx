"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  CSL_HIDE_KEY,
  CSL_REVIEW_KEY,
  PSG_DENSITY_KEY,
  PSG_KEY,
  PSG_MATERIALS,
  PSG_VIEW_KEY,
  addPastiglia,
  addPastigliaTag,
  addPastigliaView,
  briskPastiglia,
  bulkSlipReview,
  bulkPastigliaIvory,
  bulkPastigliaRaise,
  bulkPastigliaTag,
  bulkPastigliaChest,
  busiestHand,
  dropPastigliaView,
  editPastiglia,
  editPastigliaNote,
  fairHand,
  slipBlank,
  slipCopy,
  slipDigit,
  slipLit,
  slipEven,
  slipFar,
  slipDim,
  slipHue,
  slipLane,
  slipLanes,
  slipLanesCsv,
  slipFade,
  slipLength,
  slipLetter,
  slipDark,
  slipOpen,
  slipRowsCsv,
  slipShare,
  slipNear,
  slipStamp,
  slipUpper,
  ivoryQuiet,
  groundFocused,
  idlePastiglia,
  laneSlipCount,
  latePastiglia,
  leadingSlip,
  leadingSlipHue,
  lowerLiftFocused,
  lowerHourFocused,
  movePastigliaFocus,
  overduePastiglia,
  pinPastigliaFocused,
  presentSlipLanes,
  rackPastigliaFocused,
  raiseLiftFocused,
  raiseHourFocused,
  readHiddenSlip,
  readReviewedSlip,
  readPastigliaViews,
  readPastigliaList,
  reminderPastigliaList,
  restingPastiglia,
  setPastigliaFocused,
  setPastigliaGround,
  setPastigliaPin,
  setPastigliaRack,
  setPastigliaRaised,
  setPastigliaChest,
  sortPastigliaList,
  materialCool,
  materialWarm,
  suggestMaterial,
  suggestPastigliaGround,
  suggestPastigliaHour,
  pastigliaBars,
  pastigliaCopy,
  pastigliaCounts,
  pastigliaCsv,
  pastigliaDensity,
  pastigliaHands,
  pastigliaTimeline,
  toggleSlip,
  toggleSlipReview,
  visibleSlip,
  visibleSlipLanes,
  visiblePastigliaList,
  type SlipReview,
  type SlipRow,
  type SlipShape,
  type SlipValue,
  type Pastiglia,
  type PastigliaDensity,
  type PastigliaRack,
  type PastigliaSort,
  type PastigliaView,
} from "@/lib/crmv4/round389";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const GROUNDS = ["IVORY", "GRAPHITE", "CHAMPAGNE"] as const;
const HOURS = ["4", "8", "12", "16"] as const;
const LIFTS = ["1", "3", "6"] as const;

const MATERIAL_KEY: Record<string, CrmV4CopyKey> = {
  gesso: "psgGesso",
  chalk: "psgChalk",
  bole: "psgBole",
  gilt: "psgGilt",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "psgAuditSave",
  edit: "psgAuditEdit",
  note: "psgAuditNote",
  ground: "psgAuditGround",
  raise: "psgAuditRaise",
  free: "psgAuditFree",
  mould: "psgAuditMould",
  return: "psgAuditReturn",
  chest: "psgAuditChest",
  open: "psgAuditOpen",
  tag: "psgAuditTag",
  lift: "psgAuditLift",
  hour: "psgAuditHour",
  lower: "psgAuditLower",
  pin: "psgAuditPin",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  due: "ceraLaneDue",
  soon: "ceraLaneSoon",
  far: "ceraLaneFar",
  late: "ceraLaneLate",
  missed: "ceraLaneMissed",
  hold: "ceraLaneHold",
  blank: "ceraLaneBlank",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  gilt: "ceraGilt",
  pearl: "ceraPearl",
  ash: "ceraAsh",
};

const SHAPE_KEY: Record<SlipShape, CrmV4CopyKey> = {
  all: "ceraShapeAll",
  due: "ceraShapeDue",
  soon: "ceraShapeSoon",
  far: "ceraShapeFar",
  late: "ceraShapeLate",
  missed: "ceraShapeMissed",
  hold: "ceraShapeHold",
  blank: "ceraShapeBlank",
  open: "ceraShapeOpen",
  digit: "ceraShapeDigit",
  letter: "ceraShapeLetter",
  even: "ceraShapeEven",
  upper: "ceraShapeUpper",
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

function materialLabel(v4: V4, metal: string): string {
  const key = MATERIAL_KEY[metal];
  return key ? v4(key) : v4("psgBlankMaterial");
}

function groundLabel(v4: V4, ground: string): string {
  if (ground === "IVORY") return v4("psgIvory");
  if (ground === "GRAPHITE") return v4("psgGraphite");
  if (ground === "CHAMPAGNE") return v4("psgChampagne");
  return v4("psgAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("ceraBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("ceraBlank");
}

export function PastigliaBosses({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Pastiglia[]>([]);
  const [views, setViews] = useState<PastigliaView[]>([]);
  const [density, setDensity] = useState<PastigliaDensity>("open");
  const [rack, setRack] = useState<PastigliaRack>("panel");
  const [query, setQuery] = useState("");
  const [handFilter, setHandFilter] = useState("");
  const [groundFilter, setGroundFilter] = useState("all");
  const [materialFilter, setMaterialFilter] = useState("all");
  const [hourFilter, setHourFilter] = useState("all");
  const [liftFilter, setLiftFilter] = useState("all");
  const [sort, setSort] = useState<PastigliaSort>("material");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [hand, setHand] = useState("");
  const [material, setMaterial] = useState("");
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
  const [station, setStation] = useState("gesso");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readPastigliaList(readJson(PSG_KEY, [])));
    setViews(readPastigliaViews(readJson(PSG_VIEW_KEY, [])));
    setDensity(pastigliaDensity(readJson(PSG_DENSITY_KEY, "open")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Pastiglia[]) {
    setCards(next);
    writeJson(PSG_KEY, next);
  }
  function storeViews(next: PastigliaView[]) {
    setViews(next);
    writeJson(PSG_VIEW_KEY, next);
  }
  function storeDensity(next: PastigliaDensity) {
    setDensity(next);
    writeJson(PSG_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortPastigliaList(visiblePastigliaList(cards, rack, query, handFilter, groundFilter, materialFilter, hourFilter, liftFilter), sort),
    [cards, rack, query, handFilter, groundFilter, materialFilter, hourFilter, liftFilter, sort],
  );
  const counts = pastigliaCounts(cards, shown, station);
  const bars = pastigliaBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = pastigliaTimeline(cards);
  const reminders = reminderPastigliaList(cards);
  const hands = pastigliaHands(cards);
  const busy = busiestHand(cards);
  const fair = fairHand(cards, hands.join(","));
  const suggestedGround = suggestPastigliaGround(cards);
  const suggestedHour = suggestPastigliaHour(cards, clock);
  const suggestedMetal = suggestMaterial(clock);
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
        download("pastiglia.csv", pastigliaCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => movePastigliaFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => movePastigliaFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addPastiglia(cards, { title, note, hand, material, hour: hourNo, ground, lift: coatNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-pastiglia" aria-label={v4("psgTitle")} data-pastiglia="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-pastiglia-mast">
        <p className="c4-pastiglia-seal" data-logo="mono">{v4("psgLogo")}</p>
        <div>
          <p className="c4-pastiglia-kicker">{v4("psgSub")}</p>
          <h2 className="c4-title">{v4("psgTitle")}</h2>
        </div>
        <p className="c4-pastiglia-count">{shown.length}</p>
      </header>
      <p className="c4-pastiglia-links">
        <Link href={crmv4Href(base, "csl")}>{v4("ceraTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("psgCustomers")}</Link>
      </p>
      <p className="c4-pastiglia-hint">{v4("psgHint")}</p>
      {viewer && <p className="c4-pastiglia-note">{v4("psgViewer")}</p>}
      <p className="c4-pastiglia-meta">{v4("psgFair")} {fair || "—"} · {v4("psgBusy")} {busy || "—"} · {v4("psgSuggest")} {materialLabel(v4, suggestedMetal)} · {groundLabel(v4, suggestedGround)} · {suggestedHour}</p>
      <ol className="c4-pastiglia-index" aria-label={v4("psgRemind")}>
        <li data-tone="gold">{v4("psgOverdue")} {counts.overdue}</li>
        <li data-tone="pitch">{v4("psgIdle")} {counts.idle}</li>
        <li data-tone="mist">{v4("psgBrisk")} {counts.brisk}</li>
        <li data-tone="mist">{v4("psgResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-pastiglia-remind c4-pastiglia-notices" role="status" aria-label={v4("psgRemind")}>
          {reminders.map((name) => <li key={name}>{v4("psgOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-pastiglia-chart" aria-label={v4("psgChart")}>
        {bars.map((bar) => (
          <button key={bar.material} type="button" className="c4-pastiglia-column" data-on={materialFilter === bar.material ? "1" : "0"} onClick={() => setMaterialFilter(materialFilter === bar.material ? "all" : bar.material)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{materialLabel(v4, bar.material)}</span>
          </button>
        ))}
      </div>
      <form className="c4-pastiglia-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("psgEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("psgEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("psgNote")}<input className="c4-field" aria-label={v4("psgNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("psgHand")}<input className="c4-field" aria-label={v4("psgHand")} aria-required={false} value={hand} maxLength={24} disabled={viewer} onChange={(event) => setHand(event.target.value)} /></label>
        <label className="c4-lab">{v4("psgMaterial")}<select className="c4-field" aria-label={v4("psgMaterial")} value={material} disabled={viewer} onChange={(event) => setMaterial(event.target.value)}><option value="">{v4("psgBlankMaterial")}</option>{PSG_MATERIALS.map((item) => <option key={item} value={item}>{materialLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("psgGround")}<select className="c4-field" aria-label={v4("psgGround")} value={ground} disabled={viewer} onChange={(event) => setGround(event.target.value)}><option value="">{v4("psgAll")}</option>{GROUNDS.map((item) => <option key={item} value={item}>{groundLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("psgHour")}<select className="c4-field" aria-label={v4("psgHour")} value={hourNo} disabled={viewer} onChange={(event) => setHourNo(event.target.value)}><option value="">{v4("psgAll")}</option>{HOURS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("psgLift")}<select className="c4-field" aria-label={v4("psgLift")} value={coatNo} disabled={viewer} onChange={(event) => setCoatNo(event.target.value)}><option value="">{v4("psgAll")}</option>{LIFTS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("psgTag")}<input className="c4-field" aria-label={v4("psgTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("psgAdd")}</button>
      </form>
      <div className="c4-pastiglia-tools">
        <input ref={searchRef} className="c4-field c4-pastiglia-search" aria-label={v4("psgSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("psgSearch")} />
        {(["panel", "mould", "chest"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={rack === item ? "1" : "0"} onClick={() => setRack(item)}>{v4(item === "panel" ? "psgPanel" : item === "mould" ? "psgMould" : "psgChest")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={materialFilter === "warm" ? "1" : "0"} onClick={() => setMaterialFilter(materialFilter === "warm" ? "all" : "warm")}>{v4("psgWarm")}</button>
        <button type="button" className="c4-chip" data-on={materialFilter === "cool" ? "1" : "0"} onClick={() => setMaterialFilter(materialFilter === "cool" ? "all" : "cool")}>{v4("psgCool")}</button>
        {GROUNDS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={groundFilter === item ? "1" : "0"} onClick={() => setGroundFilter(groundFilter === item ? "all" : item)}>{groundLabel(v4, item)}</button>
        ))}
        {HOURS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hourFilter === item ? "1" : "0"} onClick={() => setHourFilter(hourFilter === item ? "all" : item)}>{item}</button>
        ))}
        {LIFTS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={liftFilter === item ? "1" : "0"} onClick={() => setLiftFilter(liftFilter === item ? "all" : item)}>{item}</button>
        ))}
        {hands.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={handFilter === name ? "1" : "0"} onClick={() => setHandFilter(handFilter === name ? "" : name)}>{name}</button>
        ))}
        <button type="button" className="c4-chip" data-on={sort === "hand" ? "1" : "0"} onClick={() => setSort(sort === "hand" ? "material" : "hand")}>{sort === "hand" ? v4("psgSortHand") : v4("psgSortMaterial")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "open" : "tight")}>{density === "tight" ? v4("psgTight") : v4("psgOpenDensity")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("psgTimeline")}</button>
        <label className="c4-lab">{v4("psgDesk")}<select className="c4-field" aria-label={v4("psgDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{PSG_MATERIALS.map((item) => <option key={item} value={item}>{materialLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-pastiglia-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addPastigliaView(views, { id, name: viewName, rack, query, hand: handFilter, ground: groundFilter, material: materialFilter, hour: hourFilter, lift: liftFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("psgViewName")}<input className="c4-field" aria-label={v4("psgViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("psgSaveView")}</button>
      </form>
      <ul className="c4-pastiglia-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setRack(view.rack); setQuery(view.query); setHandFilter(view.hand); setGroundFilter(view.ground); setMaterialFilter(view.material); setHourFilter(view.hour); setLiftFilter(view.lift); }}>{v4("psgApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropPastigliaView(views, view.id))}>{v4("psgDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-pastiglia-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkPastigliaRaise(cards, picked))}>{v4("psgBulkRaise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkPastigliaChest(cards, picked))}>{v4("psgBulkArchive")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkPastigliaIvory(cards, picked))}>{v4("psgBulkIvory")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkPastigliaTag(cards, picked))}>{v4("psgBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("pastiglia.csv", pastigliaCsv(shown, station))}>{v4("psgCsv")}</button>
        <p className="c4-pastiglia-meta">{v4("psgKeys")} / c x a j k · {v4("psgQuiet")} {counts.quiet} · {v4("psgWarm")} {counts.warm}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-pastiglia-time" aria-label={v4("psgTimeline")}>
          {timeline.map((row) => <li key={row.hour}><span>{row.hour}</span> {row.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("psgEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-pastiglia-list">
          {shown.map((card) => {
            const late = latePastiglia(card, station);
            return (
              <li key={card.id} className="c4-pastiglia-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idlePastiglia(card) ? "1" : "0"} data-brisk={briskPastiglia(card) ? "1" : "0"} data-overdue={overduePastiglia(card) ? "1" : "0"} data-resting={restingPastiglia(card) ? "1" : "0"} data-warm={materialWarm(card.material) ? "1" : "0"} data-cool={materialCool(card.material) ? "1" : "0"} data-quiet={ivoryQuiet(card.ground) ? "1" : "0"}>
                <label className="c4-pastiglia-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editPastiglia(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("psgEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("psgApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editPastigliaNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("psgNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-pastiglia-meta">{materialLabel(v4, card.material)} · {groundLabel(v4, card.ground)} · {card.hour ?? "—"} · {card.lift} · {card.hand || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "psgAuditSave")}` : ""}{late ? ` · ${v4("psgOverdue")}` : ""}</p>
                </div>
                <div className="c4-pastiglia-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("psgEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setPastigliaRaised(cards, card.id, !card.raised))}>{card.raised ? v4("psgFree") : v4("psgRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setPastigliaGround(cards, card.id, suggestedGround))}>{v4("psgSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setPastigliaRack(cards, card.id, !card.moulded))}>{card.moulded ? v4("psgUnmould") : v4("psgMouldIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setPastigliaChest(cards, card.id, !card.chested))}>{card.chested ? v4("psgUnchest") : v4("psgChestIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setPastigliaPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("psgUnpin") : v4("psgPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addPastigliaTag(cards, card.id, "p"))}>{v4("psgTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHourFocused(cards, card.id))}>{v4("psgRaiseHour")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHourFocused(cards, card.id))}>{v4("psgLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseLiftFocused(cards, card.id))}>{v4("psgLift")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerLiftFocused(cards, card.id))}>{v4("psgLift")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(groundFocused(cards, card.id))}>{v4("psgGround")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setPastigliaFocused(cards, card.id))}>{v4("psgRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(rackPastigliaFocused(cards, card.id))}>{v4("psgMould")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinPastigliaFocused(cards, card.id))}>{v4("psgPin")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(pastigliaCopy(card))}>{v4("psgCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type CapUser = { id?: string; name?: string | null; city?: string | null };

export function CeraSlips({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: CapUser[] }>("/api/admin/users?take=24&meta=0");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<SlipShape>("all");
  const [review, setReview] = useState<SlipReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): SlipRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      userId: id,
      code: { city: textField(row.city) } satisfies SlipValue,
    };
  }).filter((row): row is SlipRow => Boolean(row));
  const present = presentSlipLanes(rows);
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
    const next = readHiddenSlip(readJson(CSL_HIDE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(CSL_HIDE_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedSlip(readJson(CSL_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(CSL_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleSlipLanes(present, hidden, showHidden);
  const shown = visibleSlip(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = slipLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = slipLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingSlip(rows);
  const leadHue = leadingSlipHue(rows);
  const whole = rows.filter((row) => slipLane(row.code)).length;
  const share = slipShare(laneSlipCount(rows, "due"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("cera-lanes.csv", slipLanesCsv(rows));
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
    writeJson(CSL_HIDE_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(CSL_REVIEW_KEY, next);
  }

  return (
    <section className="c4-cera" aria-label={v4("ceraTitle")} data-cera="1" data-role={role} data-names="1">
      <header className="c4-cera-mast">
        <p className="c4-cera-seal" data-logo="mono">{v4("ceraLogo")}</p>
        <div>
          <p className="c4-cera-kicker">{v4("ceraSub")}</p>
          <h2 className="c4-title">{v4("ceraTitle")}</h2>
        </div>
        <p className="c4-cera-count">{shown.length}</p>
      </header>
      <p className="c4-cera-links">
        <Link href={crmv4Href(base, "psg")}>{v4("psgTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("ceraCustomer")}</Link>
      </p>
      <p className="c4-cera-hint">{v4("ceraHint")}</p>
      {viewer && <p className="c4-cera-note">{v4("ceraViewer")}</p>}
      {queue.loading && <p className="c4-cera-meta">{v4("ceraLoading")}</p>}
      {queue.error && <p className="c4-cera-meta">{v4("ceraFailed")}</p>}
      <p className="c4-cera-meta">{v4("ceraLead")} {laneLabel(v4, lead)} · {v4("ceraToneLead")} {hueLabel(v4, leadHue)} · {v4("ceraShare")} {share}</p>
      <div className="c4-cera-chart" aria-label={v4("ceraChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-cera-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ height: `${Math.max(12, Math.round((line.count / peak) * 72))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-cera-tools">
        <input ref={searchRef} className="c4-field c4-cera-search" aria-label={v4("ceraSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("ceraSearch")} />
        <label className="c4-lab">{v4("ceraChart")}<select className="c4-field" aria-label={v4("ceraChart")} value={shape} onChange={(event) => setShape(event.target.value as SlipShape)}>{(Object.keys(SHAPE_KEY) as SlipShape[]).map((item) => <option key={item} value={item}>{v4(SHAPE_KEY[item])}</option>)}</select></label>
        <button type="button" className="c4-chip" data-on={hue === "gilt" ? "1" : "0"} onClick={() => setHue(hue === "gilt" ? "all" : "gilt")}>{v4("ceraGilt")}</button>
        <button type="button" className="c4-chip" data-on={hue === "pearl" ? "1" : "0"} onClick={() => setHue(hue === "pearl" ? "all" : "pearl")}>{v4("ceraPearl")}</button>
        <button type="button" className="c4-chip" data-on={hue === "ash" ? "1" : "0"} onClick={() => setHue(hue === "ash" ? "all" : "ash")}>{v4("ceraAsh")}</button>
        <button type="button" className="c4-chip" data-on={review === "fresh" ? "1" : "0"} onClick={() => setReview(review === "fresh" ? "all" : "fresh")}>{v4("ceraFresh")}</button>
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview(review === "reviewed" ? "all" : "reviewed")}>{v4("ceraReviewed")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{v4("ceraShow")}</button>
        {present.map((lane) => (
          <button key={lane} type="button" className="c4-chip" data-on={hidden.includes(lane) ? "1" : "0"} onClick={() => storeHidden(toggleSlip(hidden, lane))}>{v4("ceraHide")} {laneLabel(v4, lane)}</button>
        ))}
      </div>
      <div className="c4-cera-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkSlipReview(reviewed, picked, true))}>{v4("ceraBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkSlipReview(reviewed, picked, false))}>{v4("ceraBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("cera-cities.csv", slipRowsCsv(shown, reviewed))}>{v4("ceraRowCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("cera-lanes.csv", slipLanesCsv(rows))}>{v4("ceraCsv")}</button>
      </div>
      {!shown.length && !queue.loading && <p className="c4-pay-empty">{v4("ceraEmpty")}</p>}
      <ul className="c4-cera-list">
        {shown.map((row) => {
          const tone = slipHue(row.code);
          const name = slipCopy(row.code);
          return (
            <li key={row.id} className="c4-cera-card" data-mail={slipLane(row.code) || "open"} data-hue={tone || "none"} data-lit={slipLit(row.code) ? "1" : "0"} data-near={slipNear(row.code) ? "1" : "0"} data-far={slipFar(row.code) ? "1" : "0"} data-fade={slipFade(row.code) ? "1" : "0"} data-dark={slipDark(row.code) ? "1" : "0"} data-dim={slipDim(row.code) ? "1" : "0"} data-blank={slipBlank(row.code) ? "1" : "0"} data-open={slipOpen(row.code) ? "1" : "0"} data-even={slipEven(row.code) ? "1" : "0"} data-digit={slipDigit(row.code) ? "1" : "0"} data-letter={slipLetter(row.code) ? "1" : "0"} data-upper={slipUpper(row.code) ? "1" : "0"}>
              <label className="c4-cera-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-cera-meta">{name || v4("ceraOpen")} · {slipStamp(row.code) || "—"} · {slipLength(row.code) ?? "—"} · {laneLabel(v4, slipLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-cera-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleSlipReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("ceraReviewed") : v4("ceraReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { navigator.clipboard?.writeText(slipCopy(row.code)); setCopied(row.id); }}>{copied === row.id ? v4("ceraCopied") : v4("ceraCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.userId || row.id}`)}>{v4("ceraCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
