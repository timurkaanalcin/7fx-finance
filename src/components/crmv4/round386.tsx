"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  GGE_HIDE_KEY,
  GGE_REVIEW_KEY,
  ORL_DENSITY_KEY,
  ORL_KEY,
  ORL_METALS,
  ORL_VIEW_KEY,
  addOrmolu,
  addOrmoluTag,
  addOrmoluView,
  briskOrmolu,
  bulkGaugeReview,
  bulkOrmoluIvory,
  bulkOrmoluLift,
  bulkOrmoluTag,
  bulkOrmoluVault,
  busiestHand,
  dropOrmoluView,
  editOrmolu,
  editOrmoluNote,
  fairHand,
  gaugeBlank,
  gaugeCopy,
  gaugeDigit,
  gaugeDue,
  gaugeEven,
  gaugeFar,
  gaugeHold,
  gaugeHue,
  gaugeLane,
  gaugeLanes,
  gaugeLanesCsv,
  gaugeLate,
  gaugeLength,
  gaugeLetter,
  gaugeMissed,
  gaugeOpen,
  gaugeRowsCsv,
  gaugeShare,
  gaugeSoon,
  gaugeStamp,
  gaugeUpper,
  graphiteQuiet,
  groundFocused,
  idleOrmolu,
  laneGaugeCount,
  lateOrmolu,
  leadingGauge,
  leadingGaugeHue,
  lowerCoatFocused,
  lowerHourFocused,
  moveOrmoluFocus,
  overdueOrmolu,
  pinOrmoluFocused,
  presentGaugeLanes,
  rackOrmoluFocused,
  raiseCoatFocused,
  raiseHourFocused,
  readHiddenGauge,
  readReviewedGauge,
  readOrmoluViews,
  readOrmoluList,
  reminderOrmoluList,
  restingOrmolu,
  setOrmoluFocused,
  setOrmoluGround,
  setOrmoluPin,
  setOrmoluRack,
  setOrmoluRaised,
  setOrmoluVault,
  sortOrmoluList,
  metalCool,
  metalWarm,
  suggestMetal,
  suggestOrmoluGround,
  suggestOrmoluHour,
  ormoluBars,
  ormoluCopy,
  ormoluCounts,
  ormoluCsv,
  ormoluDensity,
  ormoluHands,
  ormoluTimeline,
  toggleGauge,
  toggleGaugeReview,
  visibleGauge,
  visibleGaugeLanes,
  visibleOrmoluList,
  type GaugeReview,
  type GaugeRow,
  type GaugeShape,
  type GaugeValue,
  type Ormolu,
  type OrmoluDensity,
  type OrmoluRack,
  type OrmoluSort,
  type OrmoluView,
} from "@/lib/crmv4/round386";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const GROUNDS = ["IVORY", "GRAPHITE", "CHAMPAGNE"] as const;
const HOURS = ["4", "8", "12", "16"] as const;
const COATS = ["1", "2", "4"] as const;

const METAL_KEY: Record<string, CrmV4CopyKey> = {
  bronze: "mntBronze",
  gilt: "mntGilt",
  pewter: "mntPewter",
  iron: "mntIron",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "mntAuditSave",
  edit: "mntAuditEdit",
  note: "mntAuditNote",
  ground: "mntAuditGround",
  raise: "mntAuditRaise",
  free: "mntAuditFree",
  tray: "mntAuditTray",
  return: "mntAuditReturn",
  vault: "mntAuditVault",
  open: "mntAuditOpen",
  tag: "mntAuditTag",
  coat: "mntAuditCoat",
  hour: "mntAuditHour",
  lower: "mntAuditLower",
  pin: "mntAuditPin",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  due: "ggeLaneDue",
  soon: "ggeLaneSoon",
  far: "ggeLaneFar",
  late: "ggeLaneLate",
  missed: "ggeLaneMissed",
  hold: "ggeLaneHold",
  blank: "ggeLaneBlank",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  gilt: "ggeGilt",
  pearl: "ggePearl",
  ink: "ggeInk",
};

const SHAPE_KEY: Record<GaugeShape, CrmV4CopyKey> = {
  all: "ggeShapeAll",
  due: "ggeShapeDue",
  soon: "ggeShapeSoon",
  far: "ggeShapeFar",
  late: "ggeShapeLate",
  missed: "ggeShapeMissed",
  hold: "ggeShapeHold",
  blank: "ggeShapeBlank",
  open: "ggeShapeOpen",
  digit: "ggeShapeDigit",
  letter: "ggeShapeLetter",
  even: "ggeShapeEven",
  upper: "ggeShapeUpper",
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

function metalLabel(v4: V4, metal: string): string {
  const key = METAL_KEY[metal];
  return key ? v4(key) : v4("mntBlankMetal");
}

function groundLabel(v4: V4, ground: string): string {
  if (ground === "IVORY") return v4("mntIvory");
  if (ground === "GRAPHITE") return v4("mntGraphite");
  if (ground === "CHAMPAGNE") return v4("mntChampagne");
  return v4("mntAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("ggeBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("ggeBlank");
}

export function OrmoluMounts({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Ormolu[]>([]);
  const [views, setViews] = useState<OrmoluView[]>([]);
  const [density, setDensity] = useState<OrmoluDensity>("open");
  const [rack, setRack] = useState<OrmoluRack>("bench");
  const [query, setQuery] = useState("");
  const [handFilter, setHandFilter] = useState("");
  const [groundFilter, setGroundFilter] = useState("all");
  const [metalFilter, setMetalFilter] = useState("all");
  const [hourFilter, setHourFilter] = useState("all");
  const [coatFilter, setCoatFilter] = useState("all");
  const [sort, setSort] = useState<OrmoluSort>("metal");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [hand, setHand] = useState("");
  const [metal, setMetal] = useState("");
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
  const [station, setStation] = useState("bronze");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readOrmoluList(readJson(ORL_KEY, [])));
    setViews(readOrmoluViews(readJson(ORL_VIEW_KEY, [])));
    setDensity(ormoluDensity(readJson(ORL_DENSITY_KEY, "open")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Ormolu[]) {
    setCards(next);
    writeJson(ORL_KEY, next);
  }
  function storeViews(next: OrmoluView[]) {
    setViews(next);
    writeJson(ORL_VIEW_KEY, next);
  }
  function storeDensity(next: OrmoluDensity) {
    setDensity(next);
    writeJson(ORL_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortOrmoluList(visibleOrmoluList(cards, rack, query, handFilter, groundFilter, metalFilter, hourFilter, coatFilter), sort),
    [cards, rack, query, handFilter, groundFilter, metalFilter, hourFilter, coatFilter, sort],
  );
  const counts = ormoluCounts(cards, shown, station);
  const bars = ormoluBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = ormoluTimeline(cards);
  const reminders = reminderOrmoluList(cards);
  const hands = ormoluHands(cards);
  const busy = busiestHand(cards);
  const fair = fairHand(cards, hands.join(","));
  const suggestedGround = suggestOrmoluGround(cards);
  const suggestedHour = suggestOrmoluHour(cards, clock);
  const suggestedMetal = suggestMetal(clock);
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
        download("ormolu.csv", ormoluCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveOrmoluFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveOrmoluFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addOrmolu(cards, { title, note, hand, metal, hour: hourNo, ground, coat: coatNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-ormolu" aria-label={v4("mntTitle")} data-ormolu="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-ormolu-mast">
        <p className="c4-ormolu-seal" data-logo="mono">{v4("mntLogo")}</p>
        <div>
          <p className="c4-ormolu-kicker">{v4("mntSub")}</p>
          <h2 className="c4-title">{v4("mntTitle")}</h2>
        </div>
        <p className="c4-ormolu-count">{shown.length}</p>
      </header>
      <p className="c4-ormolu-links">
        <Link href={crmv4Href(base, "gge")}>{v4("ggeTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("mntCustomers")}</Link>
      </p>
      <p className="c4-ormolu-hint">{v4("mntHint")}</p>
      {viewer && <p className="c4-ormolu-note">{v4("mntViewer")}</p>}
      <p className="c4-ormolu-meta">{v4("mntFair")} {fair || "—"} · {v4("mntBusy")} {busy || "—"} · {v4("mntSuggest")} {metalLabel(v4, suggestedMetal)} · {groundLabel(v4, suggestedGround)} · {suggestedHour}</p>
      <ol className="c4-ormolu-index" aria-label={v4("mntRemind")}>
        <li data-tone="gold">{v4("mntOverdue")} {counts.overdue}</li>
        <li data-tone="ink">{v4("mntIdle")} {counts.idle}</li>
        <li data-tone="pearl">{v4("mntBrisk")} {counts.brisk}</li>
        <li data-tone="pearl">{v4("mntResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-ormolu-remind c4-ormolu-notices" role="status" aria-label={v4("mntRemind")}>
          {reminders.map((name) => <li key={name}>{v4("mntOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-ormolu-chart" aria-label={v4("mntChart")}>
        {bars.map((bar) => (
          <button key={bar.metal} type="button" className="c4-ormolu-column" data-on={metalFilter === bar.metal ? "1" : "0"} onClick={() => setMetalFilter(metalFilter === bar.metal ? "all" : bar.metal)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{metalLabel(v4, bar.metal)}</span>
          </button>
        ))}
      </div>
      <form className="c4-ormolu-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("mntEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("mntEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("mntNote")}<input className="c4-field" aria-label={v4("mntNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("mntHand")}<input className="c4-field" aria-label={v4("mntHand")} aria-required={false} value={hand} maxLength={24} disabled={viewer} onChange={(event) => setHand(event.target.value)} /></label>
        <label className="c4-lab">{v4("mntMetal")}<select className="c4-field" aria-label={v4("mntMetal")} value={metal} disabled={viewer} onChange={(event) => setMetal(event.target.value)}><option value="">{v4("mntBlankMetal")}</option>{ORL_METALS.map((item) => <option key={item} value={item}>{metalLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("mntGround")}<select className="c4-field" aria-label={v4("mntGround")} value={ground} disabled={viewer} onChange={(event) => setGround(event.target.value)}><option value="">{v4("mntAll")}</option>{GROUNDS.map((item) => <option key={item} value={item}>{groundLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("mntHour")}<select className="c4-field" aria-label={v4("mntHour")} value={hourNo} disabled={viewer} onChange={(event) => setHourNo(event.target.value)}><option value="">{v4("mntAll")}</option>{HOURS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("mntCoat")}<select className="c4-field" aria-label={v4("mntCoat")} value={coatNo} disabled={viewer} onChange={(event) => setCoatNo(event.target.value)}><option value="">{v4("mntAll")}</option>{COATS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("mntTag")}<input className="c4-field" aria-label={v4("mntTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("mntAdd")}</button>
      </form>
      <div className="c4-ormolu-tools">
        <input ref={searchRef} className="c4-field c4-ormolu-search" aria-label={v4("mntSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("mntSearch")} />
        {(["bench", "tray", "vault"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={rack === item ? "1" : "0"} onClick={() => setRack(item)}>{v4(item === "bench" ? "mntBench" : item === "tray" ? "mntTray" : "mntVault")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={metalFilter === "warm" ? "1" : "0"} onClick={() => setMetalFilter(metalFilter === "warm" ? "all" : "warm")}>{v4("mntWarm")}</button>
        <button type="button" className="c4-chip" data-on={metalFilter === "cool" ? "1" : "0"} onClick={() => setMetalFilter(metalFilter === "cool" ? "all" : "cool")}>{v4("mntCool")}</button>
        {GROUNDS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={groundFilter === item ? "1" : "0"} onClick={() => setGroundFilter(groundFilter === item ? "all" : item)}>{groundLabel(v4, item)}</button>
        ))}
        {HOURS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hourFilter === item ? "1" : "0"} onClick={() => setHourFilter(hourFilter === item ? "all" : item)}>{item}</button>
        ))}
        {COATS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={coatFilter === item ? "1" : "0"} onClick={() => setCoatFilter(coatFilter === item ? "all" : item)}>{item}</button>
        ))}
        {hands.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={handFilter === name ? "1" : "0"} onClick={() => setHandFilter(handFilter === name ? "" : name)}>{name}</button>
        ))}
        <button type="button" className="c4-chip" data-on={sort === "hand" ? "1" : "0"} onClick={() => setSort(sort === "hand" ? "metal" : "hand")}>{sort === "hand" ? v4("mntSortHand") : v4("mntSortMetal")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "open" : "tight")}>{density === "tight" ? v4("mntTight") : v4("mntOpenDensity")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("mntTimeline")}</button>
        <label className="c4-lab">{v4("mntDesk")}<select className="c4-field" aria-label={v4("mntDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{ORL_METALS.map((item) => <option key={item} value={item}>{metalLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-ormolu-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addOrmoluView(views, { id, name: viewName, rack, query, hand: handFilter, ground: groundFilter, metal: metalFilter, hour: hourFilter, coat: coatFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("mntViewName")}<input className="c4-field" aria-label={v4("mntViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("mntSaveView")}</button>
      </form>
      <ul className="c4-ormolu-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setRack(view.rack); setQuery(view.query); setHandFilter(view.hand); setGroundFilter(view.ground); setMetalFilter(view.metal); setHourFilter(view.hour); setCoatFilter(view.coat); }}>{v4("mntApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropOrmoluView(views, view.id))}>{v4("mntDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-ormolu-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkOrmoluLift(cards, picked))}>{v4("mntBulkRaise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkOrmoluVault(cards, picked))}>{v4("mntBulkVault")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkOrmoluIvory(cards, picked))}>{v4("mntBulkIvory")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkOrmoluTag(cards, picked))}>{v4("mntBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("ormolu.csv", ormoluCsv(shown, station))}>{v4("mntCsv")}</button>
        <p className="c4-ormolu-meta">{v4("mntKeys")} / c x a j k · {v4("mntQuiet")} {counts.quiet} · {v4("mntWarm")} {counts.warm}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-ormolu-time" aria-label={v4("mntTimeline")}>
          {timeline.map((row) => <li key={row.hour}><span>{row.hour}</span> {row.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("mntEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-ormolu-list">
          {shown.map((card) => {
            const late = lateOrmolu(card, station);
            return (
              <li key={card.id} className="c4-ormolu-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleOrmolu(card) ? "1" : "0"} data-brisk={briskOrmolu(card) ? "1" : "0"} data-overdue={overdueOrmolu(card) ? "1" : "0"} data-resting={restingOrmolu(card) ? "1" : "0"} data-warm={metalWarm(card.metal) ? "1" : "0"} data-cool={metalCool(card.metal) ? "1" : "0"} data-quiet={graphiteQuiet(card.ground) ? "1" : "0"}>
                <label className="c4-ormolu-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editOrmolu(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("mntEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("mntApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editOrmoluNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("mntNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-ormolu-meta">{metalLabel(v4, card.metal)} · {groundLabel(v4, card.ground)} · {card.hour ?? "—"} · {card.coat} · {card.hand || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "mntAuditSave")}` : ""}{late ? ` · ${v4("mntOverdue")}` : ""}</p>
                </div>
                <div className="c4-ormolu-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("mntEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setOrmoluRaised(cards, card.id, !card.raised))}>{card.raised ? v4("mntFree") : v4("mntRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setOrmoluGround(cards, card.id, suggestedGround))}>{v4("mntSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setOrmoluRack(cards, card.id, !card.trayed))}>{card.trayed ? v4("mntUntray") : v4("mntTrayIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setOrmoluVault(cards, card.id, !card.vaulted))}>{card.vaulted ? v4("mntUnvault") : v4("mntVaultIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setOrmoluPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("mntUnpin") : v4("mntPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addOrmoluTag(cards, card.id, "b"))}>{v4("mntTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHourFocused(cards, card.id))}>{v4("mntRaiseHour")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHourFocused(cards, card.id))}>{v4("mntLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseCoatFocused(cards, card.id))}>{v4("mntCoat")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerCoatFocused(cards, card.id))}>{v4("mntCoat")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(groundFocused(cards, card.id))}>{v4("mntGround")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setOrmoluFocused(cards, card.id))}>{v4("mntRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(rackOrmoluFocused(cards, card.id))}>{v4("mntTray")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinOrmoluFocused(cards, card.id))}>{v4("mntPin")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(ormoluCopy(card))}>{v4("mntCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type CapUser = { id?: string; name?: string | null; validationStatus?: string | null };

export function ValidationGauges({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: CapUser[] }>("/api/admin/users?take=24&meta=0");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<GaugeShape>("all");
  const [review, setReview] = useState<GaugeReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): GaugeRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      userId: id,
      code: { validationStatus: textField(row.validationStatus) } satisfies GaugeValue,
    };
  }).filter((row): row is GaugeRow => Boolean(row));
  const present = presentGaugeLanes(rows);
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
    const next = readHiddenGauge(readJson(GGE_HIDE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(GGE_HIDE_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedGauge(readJson(GGE_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(GGE_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleGaugeLanes(present, hidden, showHidden);
  const shown = visibleGauge(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = gaugeLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = gaugeLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingGauge(rows);
  const leadHue = leadingGaugeHue(rows);
  const whole = rows.filter((row) => gaugeLane(row.code)).length;
  const share = gaugeShare(laneGaugeCount(rows, "due"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("validation-lanes.csv", gaugeLanesCsv(rows));
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
    writeJson(GGE_HIDE_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(GGE_REVIEW_KEY, next);
  }

  return (
    <section className="c4-valgauge" aria-label={v4("ggeTitle")} data-gauge="1" data-role={role} data-names="1">
      <header className="c4-valgauge-mast">
        <p className="c4-valgauge-seal" data-logo="mono">{v4("ggeLogo")}</p>
        <div>
          <p className="c4-valgauge-kicker">{v4("ggeSub")}</p>
          <h2 className="c4-title">{v4("ggeTitle")}</h2>
        </div>
        <p className="c4-valgauge-count">{shown.length}</p>
      </header>
      <p className="c4-valgauge-links">
        <Link href={crmv4Href(base, "mnt")}>{v4("mntTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("ggeCustomer")}</Link>
      </p>
      <p className="c4-valgauge-hint">{v4("ggeHint")}</p>
      {viewer && <p className="c4-valgauge-note">{v4("ggeViewer")}</p>}
      {queue.loading && <p className="c4-valgauge-meta">{v4("ggeLoading")}</p>}
      {queue.error && <p className="c4-valgauge-meta">{v4("ggeFailed")}</p>}
      <p className="c4-valgauge-meta">{v4("ggeLead")} {laneLabel(v4, lead)} · {v4("ggeToneLead")} {hueLabel(v4, leadHue)} · {v4("ggeShare")} {share}</p>
      <div className="c4-valgauge-chart" aria-label={v4("ggeChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-valgauge-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ height: `${Math.max(12, Math.round((line.count / peak) * 72))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-valgauge-tools">
        <input ref={searchRef} className="c4-field c4-valgauge-search" aria-label={v4("ggeSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("ggeSearch")} />
        <label className="c4-lab">{v4("ggeChart")}<select className="c4-field" aria-label={v4("ggeChart")} value={shape} onChange={(event) => setShape(event.target.value as GaugeShape)}>{(Object.keys(SHAPE_KEY) as GaugeShape[]).map((item) => <option key={item} value={item}>{v4(SHAPE_KEY[item])}</option>)}</select></label>
        <button type="button" className="c4-chip" data-on={hue === "gilt" ? "1" : "0"} onClick={() => setHue(hue === "gilt" ? "all" : "gilt")}>{v4("ggeGilt")}</button>
        <button type="button" className="c4-chip" data-on={hue === "pearl" ? "1" : "0"} onClick={() => setHue(hue === "pearl" ? "all" : "pearl")}>{v4("ggePearl")}</button>
        <button type="button" className="c4-chip" data-on={hue === "ink" ? "1" : "0"} onClick={() => setHue(hue === "ink" ? "all" : "ink")}>{v4("ggeInk")}</button>
        <button type="button" className="c4-chip" data-on={review === "fresh" ? "1" : "0"} onClick={() => setReview(review === "fresh" ? "all" : "fresh")}>{v4("ggeFresh")}</button>
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview(review === "reviewed" ? "all" : "reviewed")}>{v4("ggeReviewed")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{v4("ggeShow")}</button>
        {present.map((lane) => (
          <button key={lane} type="button" className="c4-chip" data-on={hidden.includes(lane) ? "1" : "0"} onClick={() => storeHidden(toggleGauge(hidden, lane))}>{v4("ggeHide")} {laneLabel(v4, lane)}</button>
        ))}
      </div>
      <div className="c4-valgauge-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkGaugeReview(reviewed, picked, true))}>{v4("ggeBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkGaugeReview(reviewed, picked, false))}>{v4("ggeBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("validation-status.csv", gaugeRowsCsv(shown, reviewed))}>{v4("ggeRowCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("validation-lanes.csv", gaugeLanesCsv(rows))}>{v4("ggeCsv")}</button>
      </div>
      {!shown.length && !queue.loading && <p className="c4-pay-empty">{v4("ggeEmpty")}</p>}
      <ul className="c4-valgauge-list">
        {shown.map((row) => {
          const tone = gaugeHue(row.code);
          const name = gaugeCopy(row.code);
          return (
            <li key={row.id} className="c4-valgauge-card" data-mail={gaugeLane(row.code) || "open"} data-hue={tone || "none"} data-due={gaugeDue(row.code) ? "1" : "0"} data-soon={gaugeSoon(row.code) ? "1" : "0"} data-far={gaugeFar(row.code) ? "1" : "0"} data-late={gaugeLate(row.code) ? "1" : "0"} data-missed={gaugeMissed(row.code) ? "1" : "0"} data-hold={gaugeHold(row.code) ? "1" : "0"} data-blank={gaugeBlank(row.code) ? "1" : "0"} data-open={gaugeOpen(row.code) ? "1" : "0"} data-even={gaugeEven(row.code) ? "1" : "0"} data-digit={gaugeDigit(row.code) ? "1" : "0"} data-letter={gaugeLetter(row.code) ? "1" : "0"} data-upper={gaugeUpper(row.code) ? "1" : "0"}>
              <label className="c4-valgauge-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-valgauge-meta">{name || v4("ggeOpen")} · {gaugeStamp(row.code) || "—"} · {gaugeLength(row.code) ?? "—"} · {laneLabel(v4, gaugeLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-valgauge-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleGaugeReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("ggeReviewed") : v4("ggeReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { navigator.clipboard?.writeText(gaugeCopy(row.code)); setCopied(row.id); }}>{copied === row.id ? v4("ggeCopied") : v4("ggeCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.userId || row.id}`)}>{v4("ggeCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
