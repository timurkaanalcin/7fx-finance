"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  FLW_HIDE_KEY,
  FLW_REVIEW_KEY,
  TSR_DENSITY_KEY,
  TSR_KEY,
  TSR_STONES,
  TSR_VIEW_KEY,
  addTessera,
  addTesseraTag,
  addTesseraView,
  briskTessera,
  bulkFollowReview,
  bulkTesseraIvory,
  bulkTesseraLift,
  bulkTesseraTag,
  bulkTesseraVault,
  busiestHand,
  dropTesseraView,
  editTessera,
  editTesseraNote,
  fairHand,
  followBlank,
  followCopy,
  followDigit,
  followDue,
  followEven,
  followFar,
  followHold,
  followHue,
  followLane,
  followLanes,
  followLanesCsv,
  followLate,
  followLength,
  followLetter,
  followMissed,
  followOpen,
  followRowsCsv,
  followShare,
  followSoon,
  followStamp,
  followUpper,
  graphiteQuiet,
  groundFocused,
  idleTessera,
  laneFollowCount,
  lateTessera,
  leadingFollow,
  leadingFollowHue,
  lowerCoatFocused,
  lowerHourFocused,
  moveTesseraFocus,
  overdueTessera,
  pinTesseraFocused,
  presentFollowLanes,
  rackTesseraFocused,
  raiseCoatFocused,
  raiseHourFocused,
  readHiddenFollow,
  readReviewedFollow,
  readTesseraViews,
  readTesserae,
  reminderTesserae,
  restingTessera,
  setTesseraFocused,
  setTesseraGround,
  setTesseraPin,
  setTesseraRack,
  setTesseraRaised,
  setTesseraVault,
  sortTesserae,
  stoneCool,
  stoneWarm,
  suggestStone,
  suggestTesseraGround,
  suggestTesseraHour,
  tesseraBars,
  tesseraCopy,
  tesseraCounts,
  tesseraCsv,
  tesseraDensity,
  tesseraHands,
  tesseraTimeline,
  toggleFollow,
  toggleFollowReview,
  visibleFollow,
  visibleFollowLanes,
  visibleTesserae,
  type FollowReview,
  type FollowRow,
  type FollowShape,
  type FollowValue,
  type Tessera,
  type TesseraDensity,
  type TesseraRack,
  type TesseraSort,
  type TesseraView,
} from "@/lib/crmv4/round385";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const GROUNDS = ["IVORY", "GRAPHITE", "CHAMPAGNE"] as const;
const HOURS = ["4", "8", "12", "16"] as const;
const COATS = ["1", "2", "4"] as const;

const STONE_KEY: Record<string, CrmV4CopyKey> = {
  jasper: "tsrJasper",
  agate: "tsrAgate",
  lapis: "tsrLapis",
  onyx: "tsrOnyx",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "tsrAuditSave",
  edit: "tsrAuditEdit",
  note: "tsrAuditNote",
  ground: "tsrAuditGround",
  raise: "tsrAuditRaise",
  free: "tsrAuditFree",
  tray: "tsrAuditTray",
  return: "tsrAuditReturn",
  vault: "tsrAuditVault",
  open: "tsrAuditOpen",
  tag: "tsrAuditTag",
  coat: "tsrAuditCoat",
  hour: "tsrAuditHour",
  lower: "tsrAuditLower",
  pin: "tsrAuditPin",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  due: "fclLaneDue",
  soon: "fclLaneSoon",
  far: "fclLaneFar",
  late: "fclLaneLate",
  missed: "fclLaneMissed",
  hold: "fclLaneHold",
  blank: "fclLaneBlank",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  gilt: "fclGilt",
  pearl: "fclPearl",
  ink: "fclInk",
};

const SHAPE_KEY: Record<FollowShape, CrmV4CopyKey> = {
  all: "fclShapeAll",
  due: "fclShapeDue",
  soon: "fclShapeSoon",
  far: "fclShapeFar",
  late: "fclShapeLate",
  missed: "fclShapeMissed",
  hold: "fclShapeHold",
  blank: "fclShapeBlank",
  open: "fclShapeOpen",
  digit: "fclShapeDigit",
  letter: "fclShapeLetter",
  even: "fclShapeEven",
  upper: "fclShapeUpper",
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

function stoneLabel(v4: V4, stone: string): string {
  const key = STONE_KEY[stone];
  return key ? v4(key) : v4("tsrBlankStone");
}

function groundLabel(v4: V4, ground: string): string {
  if (ground === "IVORY") return v4("tsrIvory");
  if (ground === "GRAPHITE") return v4("tsrGraphite");
  if (ground === "CHAMPAGNE") return v4("tsrChampagne");
  return v4("tsrAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("fclBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("fclBlank");
}

export function PietraTesserae({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Tessera[]>([]);
  const [views, setViews] = useState<TesseraView[]>([]);
  const [density, setDensity] = useState<TesseraDensity>("open");
  const [rack, setRack] = useState<TesseraRack>("bench");
  const [query, setQuery] = useState("");
  const [handFilter, setHandFilter] = useState("");
  const [groundFilter, setGroundFilter] = useState("all");
  const [stoneFilter, setStoneFilter] = useState("all");
  const [hourFilter, setHourFilter] = useState("all");
  const [coatFilter, setCoatFilter] = useState("all");
  const [sort, setSort] = useState<TesseraSort>("stone");
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
  const [station, setStation] = useState("jasper");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readTesserae(readJson(TSR_KEY, [])));
    setViews(readTesseraViews(readJson(TSR_VIEW_KEY, [])));
    setDensity(tesseraDensity(readJson(TSR_DENSITY_KEY, "open")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Tessera[]) {
    setCards(next);
    writeJson(TSR_KEY, next);
  }
  function storeViews(next: TesseraView[]) {
    setViews(next);
    writeJson(TSR_VIEW_KEY, next);
  }
  function storeDensity(next: TesseraDensity) {
    setDensity(next);
    writeJson(TSR_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortTesserae(visibleTesserae(cards, rack, query, handFilter, groundFilter, stoneFilter, hourFilter, coatFilter), sort),
    [cards, rack, query, handFilter, groundFilter, stoneFilter, hourFilter, coatFilter, sort],
  );
  const counts = tesseraCounts(cards, shown, station);
  const bars = tesseraBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = tesseraTimeline(cards);
  const reminders = reminderTesserae(cards);
  const hands = tesseraHands(cards);
  const busy = busiestHand(cards);
  const fair = fairHand(cards, hands.join(","));
  const suggestedGround = suggestTesseraGround(cards);
  const suggestedHour = suggestTesseraHour(cards, clock);
  const suggestedStone = suggestStone(clock);
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
        download("tesserae.csv", tesseraCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveTesseraFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveTesseraFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addTessera(cards, { title, note, hand, stone, hour: hourNo, ground, coat: coatNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-tessera" aria-label={v4("tsrTitle")} data-tesserae="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-tessera-mast">
        <p className="c4-tessera-seal" data-logo="mono">{v4("tsrLogo")}</p>
        <div>
          <p className="c4-tessera-kicker">{v4("tsrSub")}</p>
          <h2 className="c4-title">{v4("tsrTitle")}</h2>
        </div>
        <p className="c4-tessera-count">{shown.length}</p>
      </header>
      <p className="c4-tessera-links">
        <Link href={crmv4Href(base, "fcl")}>{v4("fclTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("tsrCustomers")}</Link>
      </p>
      <p className="c4-tessera-hint">{v4("tsrHint")}</p>
      {viewer && <p className="c4-tessera-note">{v4("tsrViewer")}</p>}
      <p className="c4-tessera-meta">{v4("tsrFair")} {fair || "—"} · {v4("tsrBusy")} {busy || "—"} · {v4("tsrSuggest")} {stoneLabel(v4, suggestedStone)} · {groundLabel(v4, suggestedGround)} · {suggestedHour}</p>
      <ol className="c4-tessera-index" aria-label={v4("tsrRemind")}>
        <li data-tone="gold">{v4("tsrOverdue")} {counts.overdue}</li>
        <li data-tone="ink">{v4("tsrIdle")} {counts.idle}</li>
        <li data-tone="pearl">{v4("tsrBrisk")} {counts.brisk}</li>
        <li data-tone="pearl">{v4("tsrResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-tessera-remind c4-tessera-notices" role="status" aria-label={v4("tsrRemind")}>
          {reminders.map((name) => <li key={name}>{v4("tsrOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-tessera-chart" aria-label={v4("tsrChart")}>
        {bars.map((bar) => (
          <button key={bar.stone} type="button" className="c4-tessera-column" data-on={stoneFilter === bar.stone ? "1" : "0"} onClick={() => setStoneFilter(stoneFilter === bar.stone ? "all" : bar.stone)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{stoneLabel(v4, bar.stone)}</span>
          </button>
        ))}
      </div>
      <form className="c4-tessera-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("tsrEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("tsrEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("tsrNote")}<input className="c4-field" aria-label={v4("tsrNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("tsrHand")}<input className="c4-field" aria-label={v4("tsrHand")} aria-required={false} value={hand} maxLength={24} disabled={viewer} onChange={(event) => setHand(event.target.value)} /></label>
        <label className="c4-lab">{v4("tsrStone")}<select className="c4-field" aria-label={v4("tsrStone")} value={stone} disabled={viewer} onChange={(event) => setStone(event.target.value)}><option value="">{v4("tsrBlankStone")}</option>{TSR_STONES.map((item) => <option key={item} value={item}>{stoneLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("tsrGround")}<select className="c4-field" aria-label={v4("tsrGround")} value={ground} disabled={viewer} onChange={(event) => setGround(event.target.value)}><option value="">{v4("tsrAll")}</option>{GROUNDS.map((item) => <option key={item} value={item}>{groundLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("tsrHour")}<select className="c4-field" aria-label={v4("tsrHour")} value={hourNo} disabled={viewer} onChange={(event) => setHourNo(event.target.value)}><option value="">{v4("tsrAll")}</option>{HOURS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("tsrCoat")}<select className="c4-field" aria-label={v4("tsrCoat")} value={coatNo} disabled={viewer} onChange={(event) => setCoatNo(event.target.value)}><option value="">{v4("tsrAll")}</option>{COATS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("tsrTag")}<input className="c4-field" aria-label={v4("tsrTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("tsrAdd")}</button>
      </form>
      <div className="c4-tessera-tools">
        <input ref={searchRef} className="c4-field c4-tessera-search" aria-label={v4("tsrSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("tsrSearch")} />
        {(["bench", "tray", "vault"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={rack === item ? "1" : "0"} onClick={() => setRack(item)}>{v4(item === "bench" ? "tsrBench" : item === "tray" ? "tsrTray" : "tsrVault")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={stoneFilter === "warm" ? "1" : "0"} onClick={() => setStoneFilter(stoneFilter === "warm" ? "all" : "warm")}>{v4("tsrWarm")}</button>
        <button type="button" className="c4-chip" data-on={stoneFilter === "cool" ? "1" : "0"} onClick={() => setStoneFilter(stoneFilter === "cool" ? "all" : "cool")}>{v4("tsrCool")}</button>
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
        <button type="button" className="c4-chip" data-on={sort === "hand" ? "1" : "0"} onClick={() => setSort(sort === "hand" ? "stone" : "hand")}>{sort === "hand" ? v4("tsrSortHand") : v4("tsrSortStone")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "open" : "tight")}>{density === "tight" ? v4("tsrTight") : v4("tsrOpenDensity")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("tsrTimeline")}</button>
        <label className="c4-lab">{v4("tsrDesk")}<select className="c4-field" aria-label={v4("tsrDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{TSR_STONES.map((item) => <option key={item} value={item}>{stoneLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-tessera-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addTesseraView(views, { id, name: viewName, rack, query, hand: handFilter, ground: groundFilter, stone: stoneFilter, hour: hourFilter, coat: coatFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("tsrViewName")}<input className="c4-field" aria-label={v4("tsrViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("tsrSaveView")}</button>
      </form>
      <ul className="c4-tessera-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setRack(view.rack); setQuery(view.query); setHandFilter(view.hand); setGroundFilter(view.ground); setStoneFilter(view.stone); setHourFilter(view.hour); setCoatFilter(view.coat); }}>{v4("tsrApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropTesseraView(views, view.id))}>{v4("tsrDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-tessera-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkTesseraLift(cards, picked))}>{v4("tsrBulkRaise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkTesseraVault(cards, picked))}>{v4("tsrBulkVault")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkTesseraIvory(cards, picked))}>{v4("tsrBulkIvory")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkTesseraTag(cards, picked))}>{v4("tsrBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("tesserae.csv", tesseraCsv(shown, station))}>{v4("tsrCsv")}</button>
        <p className="c4-tessera-meta">{v4("tsrKeys")} / c x a j k · {v4("tsrQuiet")} {counts.quiet} · {v4("tsrWarm")} {counts.warm}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-tessera-time" aria-label={v4("tsrTimeline")}>
          {timeline.map((row) => <li key={row.hour}><span>{row.hour}</span> {row.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("tsrEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-tessera-list">
          {shown.map((card) => {
            const late = lateTessera(card, station);
            return (
              <li key={card.id} className="c4-tessera-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleTessera(card) ? "1" : "0"} data-brisk={briskTessera(card) ? "1" : "0"} data-overdue={overdueTessera(card) ? "1" : "0"} data-resting={restingTessera(card) ? "1" : "0"} data-warm={stoneWarm(card.stone) ? "1" : "0"} data-cool={stoneCool(card.stone) ? "1" : "0"} data-quiet={graphiteQuiet(card.ground) ? "1" : "0"}>
                <label className="c4-tessera-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editTessera(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("tsrEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("tsrApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editTesseraNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("tsrNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-tessera-meta">{stoneLabel(v4, card.stone)} · {groundLabel(v4, card.ground)} · {card.hour ?? "—"} · {card.coat} · {card.hand || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "tsrAuditSave")}` : ""}{late ? ` · ${v4("tsrOverdue")}` : ""}</p>
                </div>
                <div className="c4-tessera-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("tsrEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTesseraRaised(cards, card.id, !card.raised))}>{card.raised ? v4("tsrFree") : v4("tsrRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTesseraGround(cards, card.id, suggestedGround))}>{v4("tsrSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTesseraRack(cards, card.id, !card.trayed))}>{card.trayed ? v4("tsrUntray") : v4("tsrTrayIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTesseraVault(cards, card.id, !card.vaulted))}>{card.vaulted ? v4("tsrUnvault") : v4("tsrVaultIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTesseraPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("tsrUnpin") : v4("tsrPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addTesseraTag(cards, card.id, "j"))}>{v4("tsrTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHourFocused(cards, card.id))}>{v4("tsrRaiseHour")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHourFocused(cards, card.id))}>{v4("tsrLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseCoatFocused(cards, card.id))}>{v4("tsrCoat")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerCoatFocused(cards, card.id))}>{v4("tsrCoat")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(groundFocused(cards, card.id))}>{v4("tsrGround")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTesseraFocused(cards, card.id))}>{v4("tsrRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(rackTesseraFocused(cards, card.id))}>{v4("tsrTray")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinTesseraFocused(cards, card.id))}>{v4("tsrPin")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(tesseraCopy(card))}>{v4("tsrCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type CapUser = { id?: string; name?: string | null; retentionFollowUpAt?: string | null };

export function FollowCalipers({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: CapUser[] }>("/api/admin/users?take=24&meta=0");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<FollowShape>("all");
  const [review, setReview] = useState<FollowReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): FollowRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      userId: id,
      code: { retentionFollowUpAt: textField(row.retentionFollowUpAt) } satisfies FollowValue,
    };
  }).filter((row): row is FollowRow => Boolean(row));
  const present = presentFollowLanes(rows);
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
    const next = readHiddenFollow(readJson(FLW_HIDE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(FLW_HIDE_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedFollow(readJson(FLW_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(FLW_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleFollowLanes(present, hidden, showHidden);
  const shown = visibleFollow(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = followLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = followLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingFollow(rows);
  const leadHue = leadingFollowHue(rows);
  const whole = rows.filter((row) => followLane(row.code)).length;
  const share = followShare(laneFollowCount(rows, "due"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("follow-lanes.csv", followLanesCsv(rows));
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
    writeJson(FLW_HIDE_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(FLW_REVIEW_KEY, next);
  }

  return (
    <section className="c4-followcal" aria-label={v4("fclTitle")} data-follow="1" data-role={role} data-names="1">
      <header className="c4-followcal-mast">
        <p className="c4-followcal-seal" data-logo="mono">{v4("fclLogo")}</p>
        <div>
          <p className="c4-followcal-kicker">{v4("fclSub")}</p>
          <h2 className="c4-title">{v4("fclTitle")}</h2>
        </div>
        <p className="c4-followcal-count">{shown.length}</p>
      </header>
      <p className="c4-followcal-links">
        <Link href={crmv4Href(base, "tsr")}>{v4("tsrTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("fclCustomer")}</Link>
      </p>
      <p className="c4-followcal-hint">{v4("fclHint")}</p>
      {viewer && <p className="c4-followcal-note">{v4("fclViewer")}</p>}
      {queue.loading && <p className="c4-followcal-meta">{v4("fclLoading")}</p>}
      {queue.error && <p className="c4-followcal-meta">{v4("fclFailed")}</p>}
      <p className="c4-followcal-meta">{v4("fclLead")} {laneLabel(v4, lead)} · {v4("fclToneLead")} {hueLabel(v4, leadHue)} · {v4("fclShare")} {share}</p>
      <div className="c4-followcal-chart" aria-label={v4("fclChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-followcal-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ height: `${Math.max(12, Math.round((line.count / peak) * 72))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-followcal-tools">
        <input ref={searchRef} className="c4-field c4-followcal-search" aria-label={v4("fclSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("fclSearch")} />
        <label className="c4-lab">{v4("fclChart")}<select className="c4-field" aria-label={v4("fclChart")} value={shape} onChange={(event) => setShape(event.target.value as FollowShape)}>{(Object.keys(SHAPE_KEY) as FollowShape[]).map((item) => <option key={item} value={item}>{v4(SHAPE_KEY[item])}</option>)}</select></label>
        <button type="button" className="c4-chip" data-on={hue === "gilt" ? "1" : "0"} onClick={() => setHue(hue === "gilt" ? "all" : "gilt")}>{v4("fclGilt")}</button>
        <button type="button" className="c4-chip" data-on={hue === "pearl" ? "1" : "0"} onClick={() => setHue(hue === "pearl" ? "all" : "pearl")}>{v4("fclPearl")}</button>
        <button type="button" className="c4-chip" data-on={hue === "ink" ? "1" : "0"} onClick={() => setHue(hue === "ink" ? "all" : "ink")}>{v4("fclInk")}</button>
        <button type="button" className="c4-chip" data-on={review === "fresh" ? "1" : "0"} onClick={() => setReview(review === "fresh" ? "all" : "fresh")}>{v4("fclFresh")}</button>
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview(review === "reviewed" ? "all" : "reviewed")}>{v4("fclReviewed")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{v4("fclShow")}</button>
        {present.map((lane) => (
          <button key={lane} type="button" className="c4-chip" data-on={hidden.includes(lane) ? "1" : "0"} onClick={() => storeHidden(toggleFollow(hidden, lane))}>{v4("fclHide")} {laneLabel(v4, lane)}</button>
        ))}
      </div>
      <div className="c4-followcal-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkFollowReview(reviewed, picked, true))}>{v4("fclBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkFollowReview(reviewed, picked, false))}>{v4("fclBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("follow-status.csv", followRowsCsv(shown, reviewed))}>{v4("fclRowCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("follow-lanes.csv", followLanesCsv(rows))}>{v4("fclCsv")}</button>
      </div>
      {!shown.length && !queue.loading && <p className="c4-pay-empty">{v4("fclEmpty")}</p>}
      <ul className="c4-followcal-list">
        {shown.map((row) => {
          const tone = followHue(row.code);
          const name = followCopy(row.code);
          return (
            <li key={row.id} className="c4-followcal-card" data-mail={followLane(row.code) || "open"} data-hue={tone || "none"} data-due={followDue(row.code) ? "1" : "0"} data-soon={followSoon(row.code) ? "1" : "0"} data-far={followFar(row.code) ? "1" : "0"} data-late={followLate(row.code) ? "1" : "0"} data-missed={followMissed(row.code) ? "1" : "0"} data-hold={followHold(row.code) ? "1" : "0"} data-blank={followBlank(row.code) ? "1" : "0"} data-open={followOpen(row.code) ? "1" : "0"} data-even={followEven(row.code) ? "1" : "0"} data-digit={followDigit(row.code) ? "1" : "0"} data-letter={followLetter(row.code) ? "1" : "0"} data-upper={followUpper(row.code) ? "1" : "0"}>
              <label className="c4-followcal-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-followcal-meta">{name || v4("fclOpen")} · {followStamp(row.code) || "—"} · {followLength(row.code) ?? "—"} · {laneLabel(v4, followLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-followcal-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleFollowReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("fclReviewed") : v4("fclReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { navigator.clipboard?.writeText(followCopy(row.code)); setCopied(row.id); }}>{copied === row.id ? v4("fclCopied") : v4("fclCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.userId || row.id}`)}>{v4("fclCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
