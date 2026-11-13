"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  PENDULUM_TEMPOS,
  PND_DENSITY_KEY,
  PND_KEY,
  PND_VIEW_KEY,
  CHT_KEY,
  CHT_REVIEW_KEY,
  addBob,
  addBobTag,
  addBobView,
  briskBob,
  bulkBobChampagne,
  bulkBobRight,
  bulkBobLatch,
  bulkBobCase,
  bulkBobTag,
  bulkCharterReview,
  busiestWinder,
  bobBars,
  bobCopy,
  bobCounts,
  bobCsv,
  bobDensity,
  bobWinders,
  bobTimeline,
  clashTempoCount,
  cycleHand,
  dropBobView,
  editBob,
  editBobNote,
  fairWinder,
  houseFinish,
  idleBob,
  idleBobs,
  laneCharterCount,
  lateBob,
  leadingCharter,
  leadingCharterHue,
  lengthenBeat,
  lengthenBeatFocused,
  lowerWeight,
  lowerWeightFocused,
  movePendulumFocus,
  neighborWeightCount,
  overdueBob,
  restBobFocused,
  latchBobFocused,
  handFocused,
  presentCharterLanes,
  keenTempo,
  raiseWeight,
  raiseWeightFocused,
  readBobs,
  readBobViews,
  readHiddenCharters,
  readReviewedCharters,
  reminderBobs,
  restingBob,
  setBobFinish,
  setBobRest,
  setBobLatch,
  setBobCase,
  setBobStar,
  sharedCharterCount,
  shortenBeat,
  shortenBeatFocused,
  sortBobs,
  charterCopy,
  charterEcho,
  charterHue,
  charterKnown,
  charterCap,
  charterLane,
  charterLanes,
  charterLanesCsv,
  charterLeap,
  charterNotch,
  charterRowsCsv,
  charterShare,
  charterSlash,
  charterStamp,
  charterStep,
  charterTail,
  charterTwin,
  charterWide,
  starBobFocused,
  stillTempo,
  suggestBeat,
  suggestTempo,
  suggestFinish,
  tagBobFocused,
  toggleCharter,
  toggleCharterReview,
  visibleBobs,
  visibleCharterLanes,
  visibleCharters,
  type BobDensity,
  type PendulumBob,
  type BobSort,
  type BobTray,
  type BobView,
  type CharterReview,
  type CharterRow,
  type CharterShape,
  type CharterValue,
} from "@/lib/crmv4/round272";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const METALS = ["ivory", "graphite", "champagne"] as const;
const HANDS = ["left", "both", "right"] as const;
const BEATS = ["40", "72", "96"] as const;
const WEIGHTS = ["1", "3", "5", "7"] as const;

const TEMPO_KEY: Record<string, CrmV4CopyKey> = {
  largo: "pndLargo",
  andante: "pndAndante",
  allegro: "pndAllegro",
  presto: "pndPresto",
  keen: "pndKeenTempo",
  still: "pndStillTempo",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "pndAuditSave",
  edit: "pndAuditEdit",
  note: "pndAuditNote",
  hand: "pndAuditHand",
  latch: "pndAuditLatch",
  unlatch: "pndAuditUnlatch",
  rest: "pndAuditRest",
  resume: "pndAuditResume",
  case: "pndAuditCase",
  open: "pndAuditOpen",
  finish: "pndAuditFinish",
  tag: "pndAuditTag",
  weight: "pndAuditWeight",
  beat: "pndAuditBeat",
  narrow: "pndAuditNarrow",
  star: "pndAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  hall: "chtHall",
  porch: "chtPorch",
  yard: "chtYard",
  gate: "chtGate",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  ivory: "chtIvory",
  graphite: "chtGraphite",
  champagne: "chtChampagne",
};

type NameRow = {
  id?: string;
  name?: string | null;
  documentsStatus?: string | null;
  code?: string | null;
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
  const node = event.target as HTMLElement | null;
  if (!node) return false;
  const tag = node.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || node.isContentEditable;
}

function textField(raw: unknown): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").trim();
}

function tempoLabel(v4: V4, tempo: string): string {
  const key = TEMPO_KEY[tempo];
  return key ? v4(key) : v4("pndBlank");
}

function finishLabel(v4: V4, finish: string): string {
  if (finish === "IVORY") return v4("pndFlax");
  if (finish === "GRAPHITE") return v4("pndWool");
  if (finish === "CHAMPAGNE") return v4("pndSilk");
  return v4("pndBlankFinish");
}

function handLabel(v4: V4, hand: string): string {
  if (hand === "left") return v4("pndLeft");
  if (hand === "both") return v4("pndBoth");
  if (hand === "right") return v4("pndRight");
  return v4("pndBlankHand");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("chtUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("chtUnmarked");
}

export function PendulumBobs({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<PendulumBob[]>([]);
  const [views, setViews] = useState<BobView[]>([]);
  const [density, setDensity] = useState<BobDensity>("airy");
  const [sort, setSort] = useState<BobSort>("tempo");
  const [tray, setTray] = useState<BobTray>("swing");
  const [query, setQuery] = useState("");
  const [winderFilter, setWinderFilter] = useState("all");
  const [finishFilter, setFinishFilter] = useState("all");
  const [handFilter, setHandFilter] = useState("all");
  const [tempoFilter, setTempoFilter] = useState("all");
  const [beatFilter, setBeatFilter] = useState("all");
  const [weightFilter, setWeightFilter] = useState("all");
  const [houseOnly, setHouseOnly] = useState(false);
  const [keenOnly, setKeenOnly] = useState(false);
  const [stillOnly, setStillOnly] = useState(false);
  const [desk, setDesk] = useState("allegro");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [winder, setWinder] = useState("");
  const [tempo, setTempo] = useState("");
  const [finish, setFinish] = useState("");
  const [hand, setHand] = useState("");
  const [beatNo, setBeatNo] = useState("");
  const [weight, setWeight] = useState("1");
  const [tags, setTags] = useState("");
  const [viewName, setViewName] = useState("");
  const [sheet, setSheet] = useState<"staff" | "index">("staff");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [copied, setCopied] = useState("");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  useEffect(() => {
    setCards(readBobs(readJson(PND_KEY, [])));
    setViews(readBobViews(readJson(PND_VIEW_KEY, [])));
    setDensity(bobDensity(readJson(PND_DENSITY_KEY, "airy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  const shown = sortBobs(visibleBobs(cards, tray, query, winderFilter, finishFilter, handFilter, tempoFilter, beatFilter, weightFilter, houseOnly, keenOnly, stillOnly), sort);
  const focusAt = shown.length ? focus % shown.length : 0;
  const counts = bobCounts(cards, shown, desk);
  const timeline = bobTimeline(cards);
  const reminders = reminderBobs(cards);
  const idling = idleBobs(cards);
  const winders = bobWinders(cards);
  const bars = bobBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const ids = shown.map((card) => card.id);
  const busy = busiestWinder(cards);
  const clock = new Date().getUTCHours();
  const suggested = suggestFinish(cards);
  const fair = fairWinder(cards, winders.join(", ") || "Nia, Sol");
  const tempoHint = suggestTempo(clock);
  function store(next: PendulumBob[]) {
    const saved = readBobs(next);
    setCards(saved);
    writeJson(PND_KEY, saved);
  }
  function storeViews(next: BobView[]) {
    const saved = readBobViews(next);
    setViews(saved);
    writeJson(PND_VIEW_KEY, saved);
  }
  function storeDensity(next: BobDensity) {
    setDensity(next);
    writeJson(PND_DENSITY_KEY, next);
  }
  function togglePick(id: string) {
    setPicked((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }
  function applyView(view: BobView) {
    setTray(view.tray);
    setQuery(view.query);
    setWinderFilter(view.winder || "all");
    setFinishFilter(view.finish);
    setHandFilter(view.hand);
    setTempoFilter(view.tempo);
    setBeatFilter(view.beat);
    setWeightFilter(view.weight);
  }
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setTitle("");
        setNote("");
        setWinder("");
        setTempo("");
        setFinish("");
        setHand("");
        setBeatNo("");
        setTags("");
        return;
      }
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => movePendulumFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => movePendulumFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "h" || event.key === "H") {
        event.preventDefault();
        if (!viewer) store(restBobFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        if (!viewer) store(latchBobFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "g" || event.key === "G") {
        event.preventDefault();
        if (!viewer) store(handFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "l" || event.key === "L") {
        event.preventDefault();
        if (!viewer) store(lengthenBeatFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        if (!viewer) store(shortenBeatFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        if (!viewer) store(tagBobFocused(cards, ids, focusAt, "x"));
        return;
      }
      if (event.key === "w" || event.key === "W") {
        event.preventDefault();
        if (!viewer) store(starBobFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "u" || event.key === "U") {
        event.preventDefault();
        if (!viewer) store(raiseWeightFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "y" || event.key === "Y") {
        event.preventDefault();
        if (!viewer) store(lowerWeightFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "b" || event.key === "B") {
        event.preventDefault();
        setSheet((value) => value === "staff" ? "index" : "staff");
        return;
      }
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shown.length, viewer, cards, ids, focusAt]);
  return (
    <section className="c4-pendulum" aria-label={v4("pndTitle")} data-cards="1" data-desk="pendulum" data-role={role} data-density={density} data-sheet={sheet}>
      <header className="c4-pendulum-mast">
        <p className="c4-pendulum-seal" data-logo="mono" aria-hidden="true">
          <span>{v4("pndLogo")}</span>
          <i />
        </p>
        <div className="c4-pendulum-mast-copy">
          <p className="c4-pendulum-kicker">{v4("pndSub")}</p>
          <h2 className="c4-title">{v4("pndTitle")}</h2>
        </div>
        <ol className="c4-pendulum-hands" aria-hidden="true">
          <li>{v4("pndLeft")}</li>
          <li>{v4("pndBoth")}</li>
          <li>{v4("pndRight")}</li>
        </ol>
      </header>
      <p className="c4-pendulum-links">
        <Link href={crmv4Href(base, "cht")}>{v4("pndPlates")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("pndCustomers")}</Link>
        <Link href={crmv4Href(base, "settings", { area: "calendar" })}>{v4("pndCalendar")}</Link>
      </p>
      {viewer && <p className="c4-pendulum-note">{v4("pndViewer")}</p>}
      <p className="c4-pendulum-lead">{v4("pndKeys")}</p>
      <p className="c4-pendulum-hint">{v4("pndHint")}</p>
      <p className="c4-pendulum-notice" role="status">{v4("pndNotice")} {counts.overdue}</p>
      <ol className="c4-pendulum-ledger" aria-label={v4("pndChart")}>
        <li><span>{v4("pndSwing")}</span><strong>{counts.swing}</strong></li>
        <li><span>{v4("pndRest")}</span><strong>{counts.rest}</strong></li>
        <li><span>{v4("pndSealed")}</span><strong>{counts.case}</strong></li>
        <li><span>{v4("pndLatched")}</span><strong>{counts.latched}</strong></li>
        <li><span>{v4("pndKeen")}</span><strong>{counts.keen}</strong></li>
        <li><span>{v4("pndStill")}</span><strong>{counts.still}</strong></li>
        <li><span>{v4("pndSoon")}</span><strong>{counts.soon}</strong></li>
        <li><span>{v4("pndOverdue")}</span><strong>{counts.overdue}</strong></li>
      </ol>
      <ol className="c4-pendulum-staff" aria-label={v4("pndBars")}>
        {bars.map((bar) => (
          <li key={bar.tempo} data-tempo={bar.tempo}>
            <strong>{bar.count}</strong>
            <i style={{ height: `${Math.max(6, Math.round((bar.count / peak) * 96))}px` }} />
            <span>{tempoLabel(v4, bar.tempo)}</span>
          </li>
        ))}
      </ol>
      <ol className="c4-pendulum-time" aria-label={v4("pndTimeline")}>
        {timeline.map((lane) => (
          <li key={lane.weight}><span>{lane.weight}</span><strong>{lane.titles.join(" · ")}</strong></li>
        ))}
      </ol>
      <div className="c4-pendulum-tools">
        <label className="c4-lab">
          <span>{v4("pndDesk")}</span>
          <select className="c4-select" aria-label={v4("pndDesk")} value={desk} onChange={(event) => setDesk(event.target.value)}>
            {PENDULUM_TEMPOS.map((item) => <option key={item} value={item}>{tempoLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("pndSearch")}</span>
          <input ref={searchRef} className="c4-field c4-pendulum-search" aria-label={v4("pndSearch")} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("pndSearch")} />
        </label>
        {(["swing", "rest", "case"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{item === "swing" ? v4("pndSwing") : item === "rest" ? v4("pndRest") : v4("pndSealed")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((value) => !value)}>{v4("pndHouseOnly")}</button>
        <button type="button" className="c4-chip" data-on={keenOnly ? "1" : "0"} onClick={() => setKeenOnly((value) => !value)}>{v4("pndKeen")}</button>
        <button type="button" className="c4-chip" data-on={stillOnly ? "1" : "0"} onClick={() => setStillOnly((value) => !value)}>{v4("pndStill")}</button>
        <button type="button" className="c4-chip" data-on={sort === "winder" ? "1" : "0"} onClick={() => setSort((value) => value === "tempo" ? "winder" : "tempo")}>{sort === "winder" ? v4("pndSortWinder") : v4("pndSortTempo")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "airy" ? "tight" : "airy")}>{density === "airy" ? v4("pndAiry") : v4("pndTight")}</button>
        <button type="button" className="c4-chip" onClick={() => setSheet((value) => value === "staff" ? "index" : "staff")}>{sheet === "staff" ? v4("pndHall") : v4("pndIndex")}</button>
      </div>
      <div className="c4-pendulum-tools">
        <select className="c4-select" aria-label={v4("pndWinder")} value={winderFilter} onChange={(event) => setWinderFilter(event.target.value)}>
          <option value="all">{v4("pndAll")}</option>
          {winders.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("pndFinish")} value={finishFilter} onChange={(event) => setFinishFilter(event.target.value)}>
          <option value="all">{v4("pndAll")}</option>
          {METALS.map((item) => <option key={item} value={item}>{finishLabel(v4, item.toUpperCase())}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("pndHand")} value={handFilter} onChange={(event) => setHandFilter(event.target.value)}>
          <option value="all">{v4("pndAll")}</option>
          {HANDS.map((item) => <option key={item} value={item}>{handLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("pndTempo")} value={tempoFilter} onChange={(event) => setTempoFilter(event.target.value)}>
          <option value="all">{v4("pndAll")}</option>
          <option value="keen">{v4("pndKeenTempo")}</option>
          <option value="still">{v4("pndStillTempo")}</option>
          {PENDULUM_TEMPOS.map((item) => <option key={item} value={item}>{tempoLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("pndBeat")} value={beatFilter} onChange={(event) => setBeatFilter(event.target.value)}>
          <option value="all">{v4("pndAll")}</option>
          {BEATS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("pndWeight")} value={weightFilter} onChange={(event) => setWeightFilter(event.target.value)}>
          <option value="all">{v4("pndAll")}</option>
          {WEIGHTS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>
      <form className="c4-pendulum-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addBob(cards, { id: `pnd-${Date.now()}`, title, note, winder, tempo, finish, hand, beat: beatNo, weight, tags });
        if (next.length === cards.length) return;
        store(next);
        setTitle("");
        setNote("");
        setTags("");
      }}>
        <label className="c4-lab"><span>{v4("pndTitleField")}</span><input className="c4-field" aria-label={v4("pndTitleField")} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("pndNote")}</span><input className="c4-field" aria-label={v4("pndNote")} aria-required={false} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <p className="c4-pendulum-meta">{v4("pndNoteOptional")}</p>
        <label className="c4-lab"><span>{v4("pndWinder")}</span><input className="c4-field" aria-label={v4("pndWinder")} value={winder} disabled={viewer} onChange={(event) => setWinder(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("pndTempo")}</span>
          <select className="c4-select" aria-label={v4("pndTempo")} value={tempo} disabled={viewer} onChange={(event) => setTempo(event.target.value)}>
            <option value="">{v4("pndBlank")}</option>
            {PENDULUM_TEMPOS.map((item) => <option key={item} value={item}>{tempoLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("pndFinish")}</span>
          <select className="c4-select" aria-label={v4("pndFinish")} value={finish} disabled={viewer} onChange={(event) => setFinish(event.target.value)}>
            <option value="">{v4("pndBlankFinish")}</option>
            {METALS.map((item) => <option key={item} value={item}>{finishLabel(v4, item.toUpperCase())}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("pndHand")}</span>
          <select className="c4-select" aria-label={v4("pndHand")} value={hand} disabled={viewer} onChange={(event) => setHand(event.target.value)}>
            <option value="">{v4("pndBlankHand")}</option>
            {HANDS.map((item) => <option key={item} value={item}>{handLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("pndBeat")}</span>
          <select className="c4-select" aria-label={v4("pndBeat")} value={beatNo} disabled={viewer} onChange={(event) => setBeatNo(event.target.value)}>
            <option value="">{v4("pndBlankBeat")}</option>
            {BEATS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("pndWeight")}</span>
          <select className="c4-select" aria-label={v4("pndWeight")} value={weight} disabled={viewer} onChange={(event) => setWeight(event.target.value)}>
            {WEIGHTS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("pndTags")}</span><input className="c4-field" aria-label={v4("pndTags")} value={tags} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("pndAdd")}</button>
      </form>
      <form className="c4-pendulum-tools" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addBobView(views, { id: `view-${Date.now()}`, name: viewName, tray, query, winder: winderFilter, finish: finishFilter, hand: handFilter, tempo: tempoFilter, beat: beatFilter, weight: weightFilter });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <label className="c4-lab"><span>{v4("pndViewName")}</span><input className="c4-field" aria-label={v4("pndViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("pndSaveView")}</button>
        {views.map((view) => (
          <span key={view.id} className="c4-pendulum-view">
            <button type="button" className="c4-btn" onClick={() => applyView(view)}>{v4("pndApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropBobView(views, view.id))}>{v4("pndDropView")}</button>
          </span>
        ))}
      </form>
      {picked.length > 0 && (
        <div className="c4-pendulum-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkBobLatch(cards, picked))}>{v4("pndBulkLatch")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkBobCase(cards, picked))}>{v4("pndBulkCase")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkBobRight(cards, picked))}>{v4("pndBulkRight")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkBobChampagne(cards, picked))}>{v4("pndBulkSilk")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkBobTag(cards, picked, "y"))}>{v4("pndBulkTag")}</button>
        </div>
      )}
      <p className="c4-pendulum-meta">{v4("pndSuggest")} {finishLabel(v4, suggested)} · {v4("pndFair")} {fair} · {v4("pndBusy")} {busy || v4("pndBlankWinder")} · {v4("pndNeighbors")} {neighborWeightCount(cards)} · {v4("pndClash")} {clashTempoCount(cards)} · {v4("pndBeatHint")} {suggestBeat(cards, clock)} · {v4("pndTempoHint")} {tempoLabel(v4, tempoHint)}</p>
      {(reminders.length > 0 || idling.length > 0) && (
        <p className="c4-pendulum-meta">{v4("pndDue")} {reminders.map((card) => card.title).join(" · ")} · {v4("pndIdle")} {idling.map((card) => card.title).join(" · ")}</p>
      )}
      {!shown.length && <p className="c4-pendulum-empty">{v4("pndEmpty")}</p>}
      <ol className={sheet === "index" ? "c4-pendulum-index" : "c4-pendulum-board"} data-density={density}>
        {shown.map((card, index) => {
          const dial = Math.round(((card.beat ?? 0) / 96) * 100);
          return (
            <li key={card.id} className="c4-pendulum-bob" data-on={index === focusAt ? "1" : "0"} data-latched={card.latched ? "1" : "0"} data-overdue={overdueBob(card) ? "1" : "0"} data-keen={keenTempo(card.tempo) ? "1" : "0"} data-still={stillTempo(card.tempo) ? "1" : "0"} data-house={houseFinish(card.finish) ? "1" : "0"} data-brisk={briskBob(card) ? "1" : "0"} data-idle={idleBob(card) ? "1" : "0"} data-resting={restingBob(card) ? "1" : "0"} data-late={lateBob(card, desk) ? "1" : "0"}>
              <div className="c4-pendulum-ring" aria-hidden="true" style={{ background: `conic-gradient(#c6a15b ${dial}%, #efe6d6 ${dial}% 100%)` }}>
                <span>{(card.title[0] || "·").toUpperCase()}</span>
              </div>
              <label className="c4-pendulum-pick"><input type="checkbox" checked={picked.includes(card.id)} aria-label={card.title} onChange={() => togglePick(card.id)} /></label>
              <div>
                <input className="c4-field" aria-label={v4("pndEdit")} value={card.title} disabled={viewer} onChange={(event) => store(editBob(cards, card.id, event.target.value))} />
                <input className="c4-field" aria-label={v4("pndEditNote")} aria-required={false} value={card.note} disabled={viewer} onChange={(event) => store(editBobNote(cards, card.id, event.target.value))} />
                <p className="c4-pendulum-meta">{card.winder || v4("pndBlankWinder")} · {tempoLabel(v4, card.tempo)} · {finishLabel(v4, card.finish)} · {handLabel(v4, card.hand)} · {card.beat ?? v4("pndBlankBeat")} · {v4("pndWeight")} {card.weight} · {card.tags.join(" ") || v4("pndTags")}</p>
                <p className="c4-pendulum-meta">{tempoLabel(v4, desk)} · {AUDIT_KEY[card.audit] ? v4(AUDIT_KEY[card.audit]) : v4("pndAuditSave")}</p>
                <div className="c4-pendulum-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBobLatch(cards, card.id, !card.latched))}>{card.latched ? v4("pndUnlatch") : v4("pndLatch")}</button>
                  <button type="button" className="c4-btn" disabled={viewer || card.cased} onClick={() => store(setBobRest(cards, card.id, !card.rested))}>{card.rested ? v4("pndResume") : v4("pndRest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBobCase(cards, card.id, !card.cased))}>{card.cased ? v4("pndOpenAgain") : v4("pndSealed")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBobStar(cards, card.id, !card.flagged))}>{card.flagged ? v4("pndUnstar") : v4("pndStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleHand(cards, card.id))}>{v4("pndHand")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lengthenBeat(cards, card.id))}>{v4("pndLengthen")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(shortenBeat(cards, card.id))}>{v4("pndShorten")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseWeight(cards, card.id))}>{v4("pndRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerWeight(cards, card.id))}>{v4("pndLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBobFinish(cards, card.id, card.finish === "CHAMPAGNE" ? "ivory" : "champagne"))}>{v4("pndFinish")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addBobTag(cards, card.id, "z"))}>{v4("pndTags")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(bobCopy(card)); setCopied(card.id); }}>{copied === card.id ? v4("pndCopied") : v4("pndCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <button type="button" className="c4-btn" onClick={() => download("pendulum-bobs.csv", bobCsv(shown, desk))}>{v4("pndCsv")}</button>
    </section>
  );
}

export function CharterPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: NameRow[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [shape, setShape] = useState<CharterShape>("all");
  const [review, setReview] = useState<CharterReview>("all");
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [copied, setCopied] = useState("");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = useMemo<CharterRow[]>(() => (queue.data?.users || []).map((row, index) => ({
    id: row.id ? `name-${row.id}` : `name-${index}`,
    label: textField(row.name),
    note: { documentsStatus: textField(row.documentsStatus) } satisfies CharterValue,
  })), [queue.data?.users]);
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
    const present = presentCharterLanes(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenCharters(readJson(CHT_KEY, []), present);
    const nextReviewed = readReviewedCharters(readJson(CHT_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(CHT_KEY, nextHidden);
    writeJson(CHT_REVIEW_KEY, nextReviewed);
  }, [rows]);
  const present = presentCharterLanes(rows);
  const lanes = visibleCharterLanes(present, hidden, showHidden);
  const shown = visibleCharters(rows, lane, hue, query, review, reviewed, shape).filter((row) => {
    const token = charterLane(row.note);
    if (!token) return true;
    return showHidden || !hidden.includes(token);
  });
  const focusAt = shown.length ? focus % shown.length : 0;
  const bars = charterLanes(rows);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const lead = leadingCharter(rows);
  const leadHue = leadingCharterHue(rows);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => movePendulumFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => movePendulumFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "m" || event.key === "M") {
        event.preventDefault();
        setShowHidden((value) => !value);
        return;
      }
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
  }, [shown, focusAt]);
  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(CHT_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(CHT_REVIEW_KEY, next);
  }
  return (
    <section className="c4-charter" aria-label={v4("chtTitle")} data-plates="1" data-names={rows.length} data-role={role}>
      <header className="c4-charter-mast">
        <p className="c4-charter-seal" data-logo="mono">{v4("chtLogo")}</p>
        <div>
          <p className="c4-charter-kicker">{v4("chtSub")}</p>
          <h2 className="c4-title">{v4("chtTitle")}</h2>
        </div>
      </header>
      <ol className="c4-charter-index" aria-label={v4("chtTitle")}>
        <li data-tone="gold">{v4("chtHall")}</li>
        <li data-tone="ink">{v4("chtPorch")}</li>
        <li data-tone="ivory">{v4("chtYard")}</li>
        <li data-tone="mist">{v4("chtGate")}</li>
      </ol>
      <p className="c4-charter-links">
        <Link href={crmv4Href(base, "pnd")}>{v4("chtBobs")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("pndCustomers")}</Link>
        <Link href={crmv4Href(base, "settings", { area: "licenses" })}>{v4("chtLicenses")}</Link>
      </p>
      <p className="c4-charter-hint">{v4("chtHint")}</p>
      {viewer && <p className="c4-charter-note">{v4("chtViewer")}</p>}
      {queue.loading && <p className="c4-charter-meta">{v4("chtEmpty")}</p>}
      {queue.error && <p className="c4-charter-meta">{queue.error}</p>}
      <ul className="c4-charter-kpis" aria-label={v4("chtRules")}>
        <li><span>{v4("chtLead")}</span><strong>{lead ? laneLabel(v4, lead) : v4("chtUnmarked")}</strong></li>
        <li><span>{v4("chtToneLead")}</span><strong>{leadHue ? hueLabel(v4, leadHue) : v4("chtUnmarked")}</strong></li>
        <li><span>{v4("chtShared")}</span><strong>{sharedCharterCount(rows)}</strong></li>
        <li><span>{v4("chtShare")}</span><strong>{charterShare(laneCharterCount(rows, "hall"), Math.max(1, rows.length))}%</strong></li>
        <li><span>{v4("chtKnown")}</span><strong>{rows.filter((row) => charterKnown(row.note)).length}</strong></li>
        <li><span>{v4("chtTwin")}</span><strong>{rows.filter((row) => charterTwin(row.note)).length}</strong></li>
        <li><span>{v4("chtSlash")}</span><strong>{rows.filter((row) => charterSlash(row.note)).length}</strong></li>
        <li><span>{v4("chtEcho")}</span><strong>{rows.filter((row) => charterEcho(row.note)).length}</strong></li>
      </ul>
      <div className="c4-charter-chart" aria-label={v4("chtRules")}>
        {bars.map((bar) => (
          <button key={bar.lane} type="button" className="c4-charter-stake" data-on={lane === bar.lane ? "1" : "0"} data-lane={bar.lane} onClick={() => setLane(lane === bar.lane ? "all" : bar.lane)}>
            <i style={{ width: `${Math.max(8, Math.round((bar.count / maxBar) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{laneLabel(v4, bar.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-charter-tools">
        <input ref={searchRef} className="c4-field c4-charter-search" aria-label={v4("chtSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("chtSearch")} />
        {(["all", "ivory", "graphite", "champagne"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("chtAll") : hueLabel(v4, item)}</button>
        ))}
        {(["all", "hall", "porch", "yard", "gate", "wide", "notch", "leap", "slash", "twin", "known", "echo"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>
            {item === "all" ? v4("chtShapeAll") : item === "wide" ? v4("chtShapeWide") : item === "notch" ? v4("chtShapeNotch") : item === "leap" ? v4("chtShapeLeap") : item === "slash" ? v4("chtShapeSlash") : item === "twin" ? v4("chtShapeTwin") : item === "known" ? v4("chtShapeKnown") : item === "echo" ? v4("chtShapeEcho") : laneLabel(v4, item)}
          </button>
        ))}
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{item === "all" ? v4("chtAll") : item === "reviewed" ? v4("chtReviewed") : v4("chtUnreviewed")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("chtShow")}</button>
      </div>
      <ul className="c4-charter-lanes">
        {lanes.map((item) => (
          <li key={item}>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(toggleCharter(hidden, item))}>{hidden.includes(item) ? v4("chtShow") : v4("chtHide")} {laneLabel(v4, item)}</button>
          </li>
        ))}
      </ul>
      {picked.length > 0 && (
        <div className="c4-charter-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkCharterReview(reviewed, picked, true))}>{v4("chtBulkReview")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkCharterReview(reviewed, picked, false))}>{v4("chtBulkClear")}</button>
        </div>
      )}
      {!shown.length && <p className="c4-charter-empty">{v4("chtEmpty")}</p>}
      <ol className="c4-charter-board">
        {shown.map((row, index) => {
          const seen = reviewed.includes(row.id);
          return (
            <li key={row.id} className="c4-charter-card" data-on={index === focusAt ? "1" : "0"} data-lane={charterLane(row.note)} data-hue={charterHue(row.note)} data-reviewed={seen ? "1" : "0"} data-known={charterKnown(row.note) ? "1" : "0"}>
              <p className="c4-charter-stamp">{charterStamp(row.note) || "·"}</p>
              <label className="c4-charter-pick"><input type="checkbox" checked={picked.includes(row.id)} aria-label={row.label || row.id} onChange={() => setPicked((current) => current.includes(row.id) ? current.filter((item) => item !== row.id) : [...current, row.id])} /></label>
              <div>
                <strong>{row.label || v4("chtUnmarked")}</strong>
                <p className="c4-charter-meta">{laneLabel(v4, charterLane(row.note))} · {hueLabel(v4, charterHue(row.note))} · {v4("chtStep")} {charterStep(row.note)}{charterCap(row.note) ? ` · ${v4("chtCap")}` : ""}{charterTail(row.note) ? ` · ${v4("chtTail")}` : ""}{charterWide(row.note) ? ` · ${v4("chtWide")}` : ""}{charterNotch(row.note) ? ` · ${v4("chtNotch")}` : ""}{charterLeap(row.note) ? ` · ${v4("chtLeap")}` : ""}</p>
                <div className="c4-charter-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleCharterReview(reviewed, row.id))}>{seen ? v4("chtReviewed") : v4("chtReview")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(charterCopy(row.note)); setCopied(row.id); }}>{copied === row.id ? v4("chtCopied") : v4("chtCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="c4-charter-tools">
        <button type="button" className="c4-btn" onClick={() => download("charter-lanes.csv", charterLanesCsv(rows))}>{v4("chtCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("charter-rows.csv", charterRowsCsv(shown, reviewed))}>{v4("chtRowCsv")}</button>
      </div>
    </section>
  );
}
