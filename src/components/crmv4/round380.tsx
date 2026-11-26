"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  BUR_DENSITY_KEY,
  BUR_GRAVERS,
  BUR_KEY,
  BUR_VIEW_KEY,
  COL_HIDE_KEY,
  COL_REVIEW_KEY,
  addBurin,
  addBurinTag,
  addBurinView,
  briskBurin,
  bulkBurinFolio,
  bulkBurinPearl,
  bulkBurinRaise,
  bulkBurinTag,
  bulkColReview,
  burinBars,
  burinCopy,
  burinCounts,
  burinCsv,
  burinDensity,
  burinHands,
  burinTimeline,
  busiestHand,
  colBare,
  colBrief,
  colCopy,
  colDesk,
  colDigit,
  colEven,
  colFamily,
  colFirst,
  colHeld,
  colHue,
  colLane,
  colLanes,
  colLanesCsv,
  colLater,
  colLength,
  colLetter,
  colLine,
  colLower,
  colMixed,
  colOpen,
  colPair,
  colReturn,
  colRowsCsv,
  colScope,
  colShare,
  colShut,
  colSpace,
  colSpanLane,
  colStamp,
  colTail,
  colUpper,
  colVowel,
  dropBurinView,
  editBurin,
  editBurinNote,
  fairHand,
  glazeFocused,
  graverCool,
  graverWarm,
  idleBurin,
  laneColCount,
  lateBurin,
  leadingCol,
  leadingColHue,
  lowerRibFocused,
  lowerSpanFocused,
  moveBurinFocus,
  overdueBurin,
  pearlQuiet,
  presentColLanes,
  raiseRibFocused,
  raiseSpanFocused,
  readBurinViews,
  readBurins,
  readHiddenCol,
  readReviewedCol,
  reminderBurins,
  restingBurin,
  setBurinFocused,
  setBurinFolio,
  setBurinGlaze,
  setBurinRaised,
  setBurinStar,
  setBurinVise,
  sortBurins,
  starBurinFocused,
  suggestGlaze,
  suggestGraver,
  suggestSpan,
  toggleCol,
  toggleColReview,
  viseBurinFocused,
  visibleBurins,
  visibleCol,
  visibleColLanes,
  type Burin,
  type BurinDensity,
  type BurinSort,
  type BurinTray,
  type BurinView,
  type ColReview,
  type ColRow,
  type ColShape,
  type ColValue,
} from "@/lib/crmv4/round380";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const GLAZES = ["PEARL", "INK", "GILT"] as const;
const SPANS = ["12", "24", "48", "96"] as const;
const RIBS = ["3", "5", "7"] as const;

const GRAVER_KEY: Record<string, CrmV4CopyKey> = {
  graver: "burGraver",
  hatch: "burHatch",
  burr: "burBurr",
  dry: "burDry",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "burAuditSave",
  edit: "burAuditEdit",
  note: "burAuditNote",
  glaze: "burAuditGlaze",
  raise: "burAuditRaise",
  free: "burAuditFree",
  vise: "burAuditVise",
  return: "burAuditReturn",
  folio: "burAuditFolio",
  open: "burAuditOpen",
  tag: "burAuditTag",
  rib: "burAuditRib",
  sla: "burAuditSpan",
  lower: "burAuditLower",
  star: "burAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  mark: "colLaneMark",
  shut: "colLaneShut",
  later: "colLaneLater",
  desk: "colLaneDesk",
  return: "colLaneReturn",
  pair: "colPair",
  scope: "colScope",
  brief: "colBrief",
  span: "colSpan",
  digit: "colStampLane",
  openv: "colShapeVowel",
  bare: "colBare",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  gilt: "colGilt",
  pearl: "colPearl",
  ink: "colInk",
};

const SHAPE_KEY: Record<ColShape, CrmV4CopyKey> = {
  all: "colShapeAll",
  mark: "colShapeMark",
  shut: "colShapeShut",
  later: "colShapeLater",
  return: "colShapeReturn",
  pair: "colShapePair",
  scope: "colShapeScope",
  brief: "colShapeBrief",
  span: "colShapeSpan",
  digit: "colShapeDigit",
  openv: "colShapeVowel",
  bare: "colShapeBare",
  open: "colShapeOpen",
  soon: "colShapeOpen",
  letter: "colShapeBare",
  mixed: "colShapeDigit",
  upper: "colShapeUpper",
  lower: "colShapeBare",
  space: "colShapeSpace",
  even: "colShapeEven",
  odd: "colShapeEven",
  tail: "colShapeDigit",
  first: "colShapeBare",
  held: "colShapeSpan",
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

function graverLabel(v4: V4, graver: string): string {
  const key = GRAVER_KEY[graver];
  return key ? v4(key) : v4("burBlankGraver");
}

function glazeLabel(v4: V4, glaze: string): string {
  if (glaze === "PEARL") return v4("burPearl");
  if (glaze === "INK") return v4("burInk");
  if (glaze === "GILT") return v4("burGilt");
  return v4("burAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("colBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("colBlank");
}

export function BurinRules({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Burin[]>([]);
  const [views, setViews] = useState<BurinView[]>([]);
  const [density, setDensity] = useState<BurinDensity>("open");
  const [tray, setTray] = useState<BurinTray>("stone");
  const [query, setQuery] = useState("");
  const [handFilter, setHandFilter] = useState("");
  const [glazeFilter, setGlazeFilter] = useState("all");
  const [graverFilter, setGraverFilter] = useState("all");
  const [slaFilter, setSlaFilter] = useState("all");
  const [ribFilter, setRibFilter] = useState("all");
  const [sort, setSort] = useState<BurinSort>("graver");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [hand, setHand] = useState("");
  const [graver, setGraver] = useState("");
  const [glaze, setGlaze] = useState("");
  const [slaNo, setSlaNo] = useState("");
  const [ribNo, setRibNo] = useState("");
  const [tags, setTags] = useState("");
  const [viewName, setViewName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focusAt, setFocusAt] = useState(0);
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteId, setNoteId] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [station, setStation] = useState("graver");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readBurins(readJson(BUR_KEY, [])));
    setViews(readBurinViews(readJson(BUR_VIEW_KEY, [])));
    setDensity(burinDensity(readJson(BUR_DENSITY_KEY, "open")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Burin[]) {
    setCards(next);
    writeJson(BUR_KEY, next);
  }
  function storeViews(next: BurinView[]) {
    setViews(next);
    writeJson(BUR_VIEW_KEY, next);
  }
  function storeDensity(next: BurinDensity) {
    setDensity(next);
    writeJson(BUR_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortBurins(visibleBurins(cards, tray, query, handFilter, glazeFilter, graverFilter, slaFilter, ribFilter), sort),
    [cards, tray, query, handFilter, glazeFilter, graverFilter, slaFilter, ribFilter, sort],
  );
  const counts = burinCounts(cards, shown, station);
  const bars = burinBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = burinTimeline(cards);
  const reminders = reminderBurins(cards);
  const hands = burinHands(cards);
  const busy = busiestHand(cards);
  const fair = fairHand(cards, hands.join(","));
  const suggestedGlaze = suggestGlaze(cards);
  const suggestedSla = suggestSpan(cards, clock);
  const suggestedGraver = suggestGraver(clock);
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
        download("burins.csv", burinCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveBurinFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveBurinFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addBurin(cards, { title, note, hand, graver, sla: slaNo, glaze, rib: ribNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-burin" aria-label={v4("burTitle")} data-cards="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-burin-mast">
        <p className="c4-burin-seal" data-logo="mono">{v4("burLogo")}</p>
        <div>
          <p className="c4-burin-kicker">{v4("burSub")}</p>
          <h2 className="c4-title">{v4("burTitle")}</h2>
        </div>
        <p className="c4-burin-count">{shown.length}</p>
      </header>
      <p className="c4-burin-links">
        <Link href={crmv4Href(base, "col")}>{v4("colTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("burCustomers")}</Link>
      </p>
      <p className="c4-burin-hint">{v4("burHint")}</p>
      {viewer && <p className="c4-burin-note">{v4("burViewer")}</p>}
      <p className="c4-burin-meta">{v4("burFair")} {fair || "—"} · {v4("burBusy")} {busy || "—"} · {v4("burSuggest")} {graverLabel(v4, suggestedGraver)} · {glazeLabel(v4, suggestedGlaze)} · {suggestedSla}</p>
      <ol className="c4-burin-index" aria-label={v4("burRemind")}>
        <li data-tone="gold">{v4("burOverdue")} {counts.overdue}</li>
        <li data-tone="ink">{v4("burIdle")} {counts.idle}</li>
        <li data-tone="pearl">{v4("burBrisk")} {counts.brisk}</li>
        <li data-tone="pearl">{v4("burResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-burin-remind c4-burin-notices" role="status" aria-label={v4("burRemind")}>
          {reminders.map((name) => <li key={name}>{v4("burOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-burin-chart" aria-label={v4("burChart")}>
        {bars.map((bar) => (
          <button key={bar.graver} type="button" className="c4-burin-column" data-on={graverFilter === bar.graver ? "1" : "0"} onClick={() => setGraverFilter(graverFilter === bar.graver ? "all" : bar.graver)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{graverLabel(v4, bar.graver)}</span>
          </button>
        ))}
      </div>
      <form className="c4-burin-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("burEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("burEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("burNote")}<input className="c4-field" aria-label={v4("burNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("burHand")}<input className="c4-field" aria-label={v4("burHand")} aria-required={false} value={hand} maxLength={24} disabled={viewer} onChange={(event) => setHand(event.target.value)} /></label>
        <label className="c4-lab">{v4("burCut")}<select className="c4-field" aria-label={v4("burCut")} value={graver} disabled={viewer} onChange={(event) => setGraver(event.target.value)}><option value="">{v4("burBlankGraver")}</option>{BUR_GRAVERS.map((item) => <option key={item} value={item}>{graverLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("burGlaze")}<select className="c4-field" aria-label={v4("burGlaze")} value={glaze} disabled={viewer} onChange={(event) => setGlaze(event.target.value)}><option value="">{v4("burAll")}</option>{GLAZES.map((item) => <option key={item} value={item}>{glazeLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("burSpan")}<select className="c4-field" aria-label={v4("burSpan")} value={slaNo} disabled={viewer} onChange={(event) => setSlaNo(event.target.value)}><option value="">{v4("burAll")}</option>{SPANS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("burRib")}<select className="c4-field" aria-label={v4("burRib")} value={ribNo} disabled={viewer} onChange={(event) => setRibNo(event.target.value)}><option value="">{v4("burAll")}</option>{RIBS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("burTag")}<input className="c4-field" aria-label={v4("burTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("burAdd")}</button>
      </form>
      <div className="c4-burin-tools">
        <input ref={searchRef} className="c4-field c4-burin-search" aria-label={v4("burSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("burSearch")} />
        {(["stone", "vise", "folio"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "stone" ? "burStone" : item === "vise" ? "burVise" : "burFolio")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={graverFilter === "warm" ? "1" : "0"} onClick={() => setGraverFilter(graverFilter === "warm" ? "all" : "warm")}>{v4("burWarm")}</button>
        <button type="button" className="c4-chip" data-on={graverFilter === "cool" ? "1" : "0"} onClick={() => setGraverFilter(graverFilter === "cool" ? "all" : "cool")}>{v4("burCool")}</button>
        {GLAZES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={glazeFilter === item ? "1" : "0"} onClick={() => setGlazeFilter(glazeFilter === item ? "all" : item)}>{glazeLabel(v4, item)}</button>
        ))}
        {SPANS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={slaFilter === item ? "1" : "0"} onClick={() => setSlaFilter(slaFilter === item ? "all" : item)}>{item}</button>
        ))}
        {RIBS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={ribFilter === item ? "1" : "0"} onClick={() => setRibFilter(ribFilter === item ? "all" : item)}>{item}</button>
        ))}
        {hands.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={handFilter === name ? "1" : "0"} onClick={() => setHandFilter(handFilter === name ? "" : name)}>{name}</button>
        ))}
        <button type="button" className="c4-chip" data-on={sort === "hand" ? "1" : "0"} onClick={() => setSort(sort === "hand" ? "graver" : "hand")}>{sort === "hand" ? v4("burSortHand") : v4("burSortCut")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "open" : "tight")}>{density === "tight" ? v4("burTight") : v4("burOpen")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("burTimeline")}</button>
        <label className="c4-lab">{v4("burDesk")}<select className="c4-field" aria-label={v4("burDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{BUR_GRAVERS.map((item) => <option key={item} value={item}>{graverLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-burin-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addBurinView(views, { id, name: viewName, tray, query, hand: handFilter, glaze: glazeFilter, graver: graverFilter, sla: slaFilter, rib: ribFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("burViewName")}<input className="c4-field" aria-label={v4("burViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("burSaveView")}</button>
      </form>
      <ul className="c4-burin-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setHandFilter(view.hand); setGlazeFilter(view.glaze); setGraverFilter(view.graver); setSlaFilter(view.sla); setRibFilter(view.rib); }}>{v4("burApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropBurinView(views, view.id))}>{v4("burDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-burin-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkBurinRaise(cards, picked))}>{v4("burBulkRaise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkBurinFolio(cards, picked))}>{v4("burBulkFolio")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkBurinPearl(cards, picked))}>{v4("burBulkPearl")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkBurinTag(cards, picked))}>{v4("burBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("burins.csv", burinCsv(shown, station))}>{v4("burCsv")}</button>
        <p className="c4-burin-meta">{v4("burKeys")} / c x a j k · {v4("burQuiet")} {counts.quiet} · {v4("burWarm")} {counts.warm}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-burin-time" aria-label={v4("burTimeline")}>
          {timeline.map((row) => <li key={row.sla}><span>{row.sla}</span> {row.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("burEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-burin-list">
          {shown.map((card) => {
            const late = lateBurin(card, station);
            return (
              <li key={card.id} className="c4-burin-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleBurin(card) ? "1" : "0"} data-brisk={briskBurin(card) ? "1" : "0"} data-overdue={overdueBurin(card) ? "1" : "0"} data-resting={restingBurin(card) ? "1" : "0"} data-warm={graverWarm(card.graver) ? "1" : "0"} data-cool={graverCool(card.graver) ? "1" : "0"} data-quiet={pearlQuiet(card.glaze) ? "1" : "0"}>
                <label className="c4-burin-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editBurin(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("burEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("burApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editBurinNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("burNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-burin-meta">{graverLabel(v4, card.graver)} · {glazeLabel(v4, card.glaze)} · {card.sla ?? "—"} · {card.rib} · {card.hand || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "burAuditSave")}` : ""}{late ? ` · ${v4("burOverdue")}` : ""}</p>
                </div>
                <div className="c4-burin-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("burEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBurinRaised(cards, card.id, !card.raised))}>{card.raised ? v4("burFree") : v4("burRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBurinGlaze(cards, card.id, suggestedGlaze))}>{v4("burSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBurinVise(cards, card.id, !card.vised))}>{card.vised ? v4("burUnvise") : v4("burViseIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBurinFolio(cards, card.id, !card.foliod))}>{card.foliod ? v4("burUnfolio") : v4("burFolioIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBurinStar(cards, card.id, !card.starred))}>{card.starred ? v4("burUnstar") : v4("burStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addBurinTag(cards, card.id, "g"))}>{v4("burTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseSpanFocused(cards, card.id))}>{v4("burRaiseSpan")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerSpanFocused(cards, card.id))}>{v4("burLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseRibFocused(cards, card.id))}>{v4("burRib")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerRibFocused(cards, card.id))}>{v4("burRib")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(glazeFocused(cards, card.id))}>{v4("burGlaze")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBurinFocused(cards, card.id))}>{v4("burRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(viseBurinFocused(cards, card.id))}>{v4("burVise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(starBurinFocused(cards, card.id))}>{v4("burStar")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(burinCopy(card))}>{v4("burCopy")}</button>
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

export function ColophonKeepers({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: CapUser[] }>("/api/admin/users?take=24&meta=0");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<ColShape>("all");
  const [review, setReview] = useState<ColReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): ColRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      userId: id,
      code: { assigneeName: textField(row.assigneeName) } satisfies ColValue,
    };
  }).filter((row): row is ColRow => Boolean(row));
  const present = presentColLanes(rows);
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
    const next = readHiddenCol(readJson(COL_HIDE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(COL_HIDE_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedCol(readJson(COL_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(COL_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleColLanes(present, hidden, showHidden);
  const shown = visibleCol(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = colLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = colLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingCol(rows);
  const leadHue = leadingColHue(rows);
  const whole = rows.filter((row) => colLane(row.code)).length;
  const share = colShare(laneColCount(rows, "mark"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("colophon-lanes.csv", colLanesCsv(rows));
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
    writeJson(COL_HIDE_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(COL_REVIEW_KEY, next);
  }

  return (
    <section className="c4-colophon" aria-label={v4("colTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-colophon-mast">
        <p className="c4-colophon-seal" data-logo="mono">{v4("colLogo")}</p>
        <div>
          <p className="c4-colophon-kicker">{v4("colSub")}</p>
          <h2 className="c4-title">{v4("colTitle")}</h2>
        </div>
        <p className="c4-colophon-count">{shown.length}</p>
      </header>
      <p className="c4-colophon-links">
        <Link href={crmv4Href(base, "brn")}>{v4("burTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("colCustomer")}</Link>
      </p>
      <p className="c4-colophon-hint">{v4("colHint")}</p>
      {viewer && <p className="c4-colophon-note">{v4("colViewer")}</p>}
      {queue.loading && <p className="c4-colophon-meta">{v4("colLoading")}</p>}
      {queue.error && <p className="c4-colophon-meta">{v4("colFailed")}</p>}
      <p className="c4-colophon-meta">{v4("colLead")} {laneLabel(v4, lead)} · {v4("colToneLead")} {hueLabel(v4, leadHue)} · {v4("colShare")} {share}</p>
      <div className="c4-colophon-chart" aria-label={v4("colChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-colophon-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ height: `${Math.max(12, Math.round((line.count / peak) * 72))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-colophon-tools">
        <input ref={searchRef} className="c4-field c4-colophon-search" aria-label={v4("colSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("colSearch")} />
        <label className="c4-lab">{v4("colChart")}<select className="c4-field" aria-label={v4("colChart")} value={shape} onChange={(event) => setShape(event.target.value as ColShape)}>{(Object.keys(SHAPE_KEY) as ColShape[]).map((item) => <option key={item} value={item}>{v4(SHAPE_KEY[item])}</option>)}</select></label>
        <button type="button" className="c4-chip" data-on={hue === "gilt" ? "1" : "0"} onClick={() => setHue(hue === "gilt" ? "all" : "gilt")}>{v4("colGilt")}</button>
        <button type="button" className="c4-chip" data-on={hue === "pearl" ? "1" : "0"} onClick={() => setHue(hue === "pearl" ? "all" : "pearl")}>{v4("colPearl")}</button>
        <button type="button" className="c4-chip" data-on={hue === "ink" ? "1" : "0"} onClick={() => setHue(hue === "ink" ? "all" : "ink")}>{v4("colInk")}</button>
        <button type="button" className="c4-chip" data-on={review === "fresh" ? "1" : "0"} onClick={() => setReview(review === "fresh" ? "all" : "fresh")}>{v4("colFresh")}</button>
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview(review === "reviewed" ? "all" : "reviewed")}>{v4("colReviewed")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{v4("colShow")}</button>
        {present.map((lane) => (
          <button key={lane} type="button" className="c4-chip" data-on={hidden.includes(lane) ? "1" : "0"} onClick={() => storeHidden(toggleCol(hidden, lane))}>{v4("colHide")} {laneLabel(v4, lane)}</button>
        ))}
      </div>
      <div className="c4-colophon-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkColReview(reviewed, picked, true))}>{v4("colBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkColReview(reviewed, picked, false))}>{v4("colBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("colophon-keepers.csv", colRowsCsv(shown, reviewed))}>{v4("colRowCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("colophon-lanes.csv", colLanesCsv(rows))}>{v4("colCsv")}</button>
      </div>
      {!shown.length && !queue.loading && <p className="c4-pay-empty">{v4("colEmpty")}</p>}
      <ul className="c4-colophon-list">
        {shown.map((row) => {
          const tone = colHue(row.code);
          const name = colCopy(row.code);
          return (
            <li key={row.id} className="c4-colophon-card" data-mail={colLane(row.code) || "open"} data-hue={tone || "none"} data-home={colLane(row.code) === "mark" ? "1" : "0"} data-away={colShut(row.code) ? "1" : "0"} data-hold={colLater(row.code) ? "1" : "0"} data-guest={colReturn(row.code) ? "1" : "0"} data-open={colOpen(row.code) ? "1" : "0"} data-even={colEven(row.code) ? "1" : "0"} data-digit={colDigit(row.code) ? "1" : "0"} data-letter={colLetter(row.code) ? "1" : "0"} data-mixed={colMixed(row.code) ? "1" : "0"} data-upper={colUpper(row.code) ? "1" : "0"} data-lower={colLower(row.code) ? "1" : "0"} data-space={colSpace(row.code) ? "1" : "0"} data-vowel={colVowel(row.code) ? "1" : "0"} data-tail={colTail(row.code) ? "1" : "0"} data-first={colFirst(row.code) ? "1" : "0"} data-held={colHeld(row.code) ? "1" : "0"} data-join={colPair(row.code) ? "1" : "0"} data-route={colScope(row.code) ? "1" : "0"} data-brief={colBrief(row.code) ? "1" : "0"} data-span={colSpanLane(row.code) ? "1" : "0"} data-bare={colBare(row.code) ? "1" : "0"} data-line={colLine(row.code) ? "1" : "0"} data-desk={colDesk(row.code) ? "1" : "0"}>
              <label className="c4-colophon-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-colophon-meta">{name || v4("colOpen")} · {colStamp(row.code) || "—"} · {colFamily(row.code) || "—"} · {colLength(row.code) ?? "—"} · {laneLabel(v4, colLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-colophon-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleColReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("colReviewed") : v4("colReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { navigator.clipboard?.writeText(colCopy(row.code)); setCopied(row.id); }}>{copied === row.id ? v4("colCopied") : v4("colCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.userId || row.id}`)}>{v4("colCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
