"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  RMT_DENSITY_KEY,
  RMT_KEY,
  RMT_PIECES,
  RMT_VIEW_KEY,
  RHB_KEY,
  RHB_REVIEW_KEY,
  addRemontoire,
  addRemontoireTag,
  addRemontoireView,
  briskRemontoire,
  bulkRemontoireLocker,
  bulkRemontoireGraphite,
  bulkRemontoireSpin,
  bulkRemontoireTag,
  bulkRhumbReview,
  busiestSmith,
  remontoireBars,
  remontoireCopy,
  remontoireCounts,
  remontoireCsv,
  remontoireDensity,
  remontoireInner,
  remontoireSmiths,
  remontoireOuter,
  remontoireTimeline,
  dropRemontoireView,
  editRemontoire,
  editRemontoireNote,
  fairSmith,
  idleRemontoire,
  inkFocused,
  laneRhumbCount,
  lateRemontoire,
  leadingRhumb,
  leadingRhumbHue,
  liftToothFocused,
  lowerTurnFocused,
  lowerToothFocused,
  moveRemontoireFocus,
  overdueRemontoire,
  hookRemontoireFocused,
  rhumbSpan,
  rhumbCapital,
  rhumbJoin,
  rhumbDigit,
  rhumbCopy,
  rhumbEven,
  rhumbFamily,
  rhumbFirst,
  rhumbHeld,
  rhumbHue,
  rhumbHyphen,
  rhumbLane,
  rhumbLanes,
  rhumbLanesCsv,
  rhumbLength,
  rhumbLetter,
  rhumbLower,
  rhumbMixed,
  rhumbVowel,
  rhumbOpen,
  rhumbPeriod,
  rhumbRowsCsv,
  rhumbShare,
  rhumbSpace,
  rhumbStamp,
  rhumbTail,
  rhumbUpper,
  presentRhumbLanes,
  raiseTurnFocused,
  readRemontoireRules,
  readRemontoireViews,
  readHiddenRhumb,
  readReviewedRhumb,
  reminderRemontoireRules,
  restingRemontoire,
  setRemontoireLocker,
  setRemontoireFocused,
  setRemontoireInk,
  setRemontoireClick,
  setRemontoireSpin,
  setRemontoireStar,
  sortRemontoireRules,
  starRemontoireFocused,
  suggestTooth,
  suggestInk,
  suggestPiece,
  toggleRhumb,
  toggleRhumbReview,
  visibleRemontoireRules,
  visibleRhumb,
  visibleRhumbLanes,
  type Remontoire,
  type RemontoireDensity,
  type RemontoireSort,
  type RemontoireTray,
  type RemontoireView,
  type RhumbReview,
  type RhumbRow,
  type RhumbShape,
  type RhumbValue,
} from "@/lib/crmv4/round321";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const INKS = ["GILT", "IVORY", "GRAPHITE"] as const;
const DROPS = ["3", "6", "9", "12"] as const;
const BEATS = ["4", "8", "12"] as const;

const VESSEL_KEY: Record<string, CrmV4CopyKey> = {
  spring: "rmtCone",
  pawl: "rmtChain",
  wheel: "rmtCam",
  detent: "rmtStop",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "rmtAuditSave",
  edit: "rmtAuditEdit",
  note: "rmtAuditNote",
  ink: "rmtAuditInk",
  set: "rmtAuditSet",
  clear: "rmtAuditClear",
  latch: "rmtAuditClick",
  resume: "rmtAuditResume",
  coffer: "rmtAuditLocker",
  open: "rmtAuditOpen",
  tag: "rmtAuditTag",
  turn: "rmtAuditTurn",
  tooth: "rmtAuditTooth",
  lower: "rmtAuditLowerTooth",
  star: "rmtAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  house: "rhbHouse",
  join: "rhbJoin",
  span: "rhbSpan",
  digit: "rhbDigit",
  stub: "rhbStub",
  scroll: "rhbScroll",
  vowel: "rhbVowel",
  path: "rhbPath",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "rhbChampagne",
  ivory: "rhbIvory",
  graphite: "rhbGraphite",
};

const SHAPE_KEY: Record<RhumbShape, CrmV4CopyKey> = {
  all: "rhbShapeAll",
  house: "rhbShapeHouse",
  join: "rhbShapeJoin",
  span: "rhbShapeSpan",
  digit: "rhbShapeDigit",
  stub: "rhbShapeStub",
  scroll: "rhbShapeScroll",
  vowel: "rhbShapeVowel",
  path: "rhbShapePath",
  open: "rhbShapeOpen",
  soon: "rhbShapeSoon",
  letter: "rhbShapeLetter",
  mixed: "rhbShapeMixed",
  upper: "rhbShapeUpper",
  lower: "rhbShapeLower",
  space: "rhbShapeSpace",
  even: "rhbShapeEven",
  odd: "rhbShapeOdd",
  tail: "rhbShapeTail",
  first: "rhbShapeFirst",
  held: "rhbShapeHeld",
  hyphen: "rhbShapeHyphen",
  period: "rhbShapePeriod",
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

function pieceLabel(v4: V4, piece: string): string {
  const key = VESSEL_KEY[piece];
  return key ? v4(key) : v4("rmtBlankPiece");
}

function inkLabel(v4: V4, ink: string): string {
  if (ink === "GILT") return v4("rmtGilt");
  if (ink === "IVORY") return v4("rmtIvory");
  if (ink === "GRAPHITE") return v4("rmtGraphite");
  return v4("rmtAll");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("rhbBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("rhbBlank");
}

export function RemontoireRules({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Remontoire[]>([]);
  const [views, setViews] = useState<RemontoireView[]>([]);
  const [density, setDensity] = useState<RemontoireDensity>("broad");
  const [tray, setTray] = useState<RemontoireTray>("barrel");
  const [query, setQuery] = useState("");
  const [smithFilter, setSmithFilter] = useState("");
  const [inkFilter, setInkFilter] = useState("all");
  const [pieceFilter, setPieceFilter] = useState("all");
  const [dropFilter, setToothFilter] = useState("all");
  const [beatFilter, setTurnFilter] = useState("all");
  const [sort, setSort] = useState<RemontoireSort>("piece");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [smith, setSmith] = useState("");
  const [piece, setPiece] = useState("");
  const [ink, setInk] = useState("");
  const [dropNo, setToothNo] = useState("");
  const [beatNo, setTurnNo] = useState("");
  const [tags, setTags] = useState("");
  const [viewName, setViewName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focusAt, setFocusAt] = useState(0);
  const [desk, setDesk] = useState("spring");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readRemontoireRules(readJson(RMT_KEY, [])));
    setViews(readRemontoireViews(readJson(RMT_VIEW_KEY, [])));
    setDensity(remontoireDensity(readJson(RMT_DENSITY_KEY, "broad")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Remontoire[]) {
    setCards(next);
    writeJson(RMT_KEY, next);
  }
  function storeViews(next: RemontoireView[]) {
    setViews(next);
    writeJson(RMT_VIEW_KEY, next);
  }
  function storeDensity(next: RemontoireDensity) {
    setDensity(next);
    writeJson(RMT_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortRemontoireRules(visibleRemontoireRules(cards, tray, query, smithFilter, inkFilter, pieceFilter, dropFilter, beatFilter), sort),
    [cards, tray, query, smithFilter, inkFilter, pieceFilter, dropFilter, beatFilter, sort],
  );
  const counts = remontoireCounts(cards, shown, desk);
  const bars = remontoireBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = remontoireTimeline(cards);
  const smiths = remontoireSmiths(cards);
  const suggested = suggestInk(cards);
  const fair = fairSmith(cards, smiths.join(","));
  const busy = busiestSmith(cards);
  const reminders = reminderRemontoireRules(cards);
  const dropHint = suggestTooth(cards, clock);
  const pieceHint = suggestPiece(clock);
  const focused = shown[focusAt];

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setTitle("");
        setNote("");
        setSmith("");
        setPiece("");
        setInk("");
        setToothNo("");
        setTurnNo("");
        setTags("");
        return;
      }
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocusAt((index) => moveRemontoireFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocusAt((index) => moveRemontoireFocus(index, shown.length, -1));
        return;
      }
      if (viewer) return;
      const id = shown[focusAt]?.id || "";
      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        store(liftToothFocused(cards, id));
        return;
      }
      if (event.key === "v" || event.key === "V") {
        event.preventDefault();
        store(setRemontoireLocker(cards, id, !shown[focusAt]?.boxed));
        return;
      }
      if (event.key === "m" || event.key === "M") {
        event.preventDefault();
        store(inkFocused(cards, id));
        return;
      }
      if (event.key === "c" || event.key === "C") {
        event.preventDefault();
        store(hookRemontoireFocused(cards, id));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        store(setRemontoireFocused(cards, id));
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("remontoire-rules.csv", remontoireCsv(shown, desk));
        return;
      }
      if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        store(starRemontoireFocused(cards, id));
        return;
      }
      if (event.key === "u" || event.key === "U") {
        event.preventDefault();
        store(raiseTurnFocused(cards, id));
        return;
      }
      if (event.key === "d" || event.key === "D") {
        event.preventDefault();
        store(lowerTurnFocused(cards, id));
        return;
      }
      if (event.key === "o" || event.key === "O") {
        event.preventDefault();
        store(lowerToothFocused(cards, id));
        return;
      }
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cards, desk, focusAt, shown, viewer]);

  return (
    <section className="c4-remontoire" aria-label={v4("rmtTitle")} data-cards="1" data-desk={tray} data-names="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-remontoire-mast">
        <p className="c4-remontoire-seal" data-logo="mono">{v4("rmtLogo")}</p>
        <div>
          <p className="c4-remontoire-kicker">{v4("rmtSub")}</p>
          <h2 className="c4-title">{v4("rmtTitle")}</h2>
        </div>
        <p className="c4-remontoire-count">{counts.matched}</p>
      </header>
      <ol className="c4-remontoire-index" aria-label={v4("rmtTitle")}>
        <li data-tone="gold">{v4("rmtArbor")} {counts.bench}</li>
        <li data-tone="ink">{v4("rmtOverdue")} {counts.overdue}</li>
        <li data-tone="ivory">{v4("rmtHouse")} {counts.house}</li>
      </ol>
      <p className="c4-remontoire-links">
        <Link href={crmv4Href(base, "rhb")}>{v4("rhbTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("rmtCustomers")}</Link>
      </p>
      <p className="c4-remontoire-hint">{v4("rmtHint")}</p>
      {viewer && <p className="c4-remontoire-note">{v4("rmtViewer")}</p>}
      {counts.overdue > 0 && <p className="c4-remontoire-notice" role="status">{v4("rmtOverdue")} {counts.overdue}</p>}
      <ol className="c4-remontoire-dials" aria-label={v4("rmtChart")}>
        <li>{v4("rmtArbor")} {counts.bench}</li>
        <li>{v4("rmtClick")} {counts.click}</li>
        <li>{v4("rmtLocker")} {counts.locker}</li>
        <li>{v4("rmtInner")} {counts.inner}</li>
        <li>{v4("rmtOuter")} {counts.outer}</li>
        <li>{v4("rmtWide")} {counts.wide}</li>
        <li>{v4("rmtStar")} {counts.starred}</li>
        <li>{v4("rmtIdle")} {counts.idle}</li>
        <li>{v4("rmtBrisk")} {counts.brisk}</li>
        <li>{v4("rmtResting")} {counts.resting}</li>
      </ol>
      <div className="c4-remontoire-chart" aria-label={v4("rmtChart")}>
        {bars.map((bar) => (
          <button key={bar.piece} type="button" className="c4-remontoire-column" data-on={pieceFilter === bar.piece ? "1" : "0"} data-piece={bar.piece} onClick={() => setPieceFilter(pieceFilter === bar.piece ? "all" : bar.piece)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{pieceLabel(v4, bar.piece)}</span>
          </button>
        ))}
      </div>
      <div className="c4-remontoire-tools">
        <input ref={searchRef} className="c4-field c4-remontoire-search" aria-label={v4("rmtSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("rmtSearch")} />
        {(["barrel", "latch", "coffer"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "barrel" ? "rmtArbor" : item === "latch" ? "rmtClick" : "rmtLocker")}</button>
        ))}
        {(["all", "inner", "outer", ...RMT_PIECES] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={pieceFilter === item ? "1" : "0"} onClick={() => setPieceFilter(item)}>{item === "all" ? v4("rmtAll") : item === "inner" ? v4("rmtInner") : item === "outer" ? v4("rmtOuter") : pieceLabel(v4, item)}</button>
        ))}
        {(["all", ...INKS] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={inkFilter === item ? "1" : "0"} onClick={() => setInkFilter(item)}>{item === "all" ? v4("rmtAll") : inkLabel(v4, item)}</button>
        ))}
        {(["all", ...DROPS] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={dropFilter === item ? "1" : "0"} onClick={() => setToothFilter(item)}>{item === "all" ? v4("rmtTooth") : item}</button>
        ))}
        {(["all", ...BEATS] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={beatFilter === item ? "1" : "0"} onClick={() => setTurnFilter(item)}>{item === "all" ? v4("rmtTurn") : item}</button>
        ))}
        <button type="button" className="c4-chip" data-on={sort === "piece" ? "1" : "0"} onClick={() => setSort("piece")}>{v4("rmtSortPiece")}</button>
        <button type="button" className="c4-chip" data-on={sort === "smith" ? "1" : "0"} onClick={() => setSort("smith")}>{v4("rmtSortSmith")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "broad" : "tight")}>{density === "tight" ? v4("rmtTight") : v4("rmtBroad")}</button>
        {RMT_PIECES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={desk === item ? "1" : "0"} onClick={() => setDesk(item)}>{v4("rmtDesk")} {pieceLabel(v4, item)}</button>
        ))}
        {smiths.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={smithFilter === name ? "1" : "0"} onClick={() => setSmithFilter(smithFilter === name ? "" : name)}>{name}</button>
        ))}
      </div>
      <p className="c4-remontoire-meta">{v4("rmtSuggest")} {inkLabel(v4, suggested)} · {dropHint} · {pieceLabel(v4, pieceHint)} · {v4("rmtFair")} {fair || "—"} · {v4("rmtBusy")} {busy || "—"}</p>
      {reminders.length > 0 && (
        <ul className="c4-remontoire-remind" aria-label={v4("rmtRemind")}>
          {reminders.map((item) => <li key={item}>{item}</li>)}
        </ul>
      )}
      {timeline.length > 0 && (
        <ol className="c4-remontoire-time" aria-label={v4("rmtTimeline")}>
          {timeline.map((lane) => <li key={lane.tooth}>{lane.tooth} · {lane.titles.join(" · ")}</li>)}
        </ol>
      )}
      <form className="c4-remontoire-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addRemontoire(cards, { title, note, smith, piece, ink, tooth: dropNo, turn: beatNo, tags });
        if (next.length === cards.length) return;
        store(next);
        setTitle("");
        setNote("");
        setTags("");
      }}>
        <input className="c4-field" aria-label={v4("rmtEdit")} aria-required={false} value={title} onChange={(event) => setTitle(event.target.value)} placeholder={v4("rmtEdit")} disabled={viewer} />
        <input className="c4-field" aria-label={v4("rmtNote")} aria-required={false} value={note} onChange={(event) => setNote(event.target.value)} placeholder={v4("rmtNote")} disabled={viewer} />
        <input className="c4-field" aria-label={v4("rmtSmith")} aria-required={false} value={smith} onChange={(event) => setSmith(event.target.value)} placeholder={v4("rmtSmith")} disabled={viewer} />
        <select className="c4-select" aria-label={v4("rmtDesk")} value={piece} onChange={(event) => setPiece(event.target.value)} disabled={viewer}>
          <option value="">{v4("rmtBlankPiece")}</option>
          {RMT_PIECES.map((item) => <option key={item} value={item}>{pieceLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("rmtInk")} value={ink} onChange={(event) => setInk(event.target.value)} disabled={viewer}>
          <option value="">{v4("rmtInk")}</option>
          {INKS.map((item) => <option key={item} value={item}>{inkLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("rmtTooth")} value={dropNo} onChange={(event) => setToothNo(event.target.value)} disabled={viewer}>
          <option value="">{v4("rmtTooth")}</option>
          {DROPS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("rmtTurn")} value={beatNo} onChange={(event) => setTurnNo(event.target.value)} disabled={viewer}>
          <option value="">{v4("rmtTurn")}</option>
          {BEATS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <input className="c4-field" aria-label={v4("rmtTag")} aria-required={false} value={tags} onChange={(event) => setTags(event.target.value)} placeholder={v4("rmtTag")} disabled={viewer} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("rmtAdd")}</button>
      </form>
      <form className="c4-remontoire-views" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addRemontoireView(views, { id: `v${Date.now().toString(36)}`, name: viewName, tray, query, smith: smithFilter, ink: inkFilter, piece: pieceFilter, tooth: dropFilter, turn: beatFilter });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <input className="c4-field" aria-label={v4("rmtViewName")} aria-required={false} value={viewName} onChange={(event) => setViewName(event.target.value)} placeholder={v4("rmtViewName")} disabled={viewer} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("rmtSaveView")}</button>
        {views.map((view) => (
          <span key={view.id} className="c4-remontoire-view">
            <button type="button" className="c4-chip" onClick={() => { setTray(view.tray); setQuery(view.query); setSmithFilter(view.smith); setInkFilter(view.ink); setPieceFilter(view.piece); setToothFilter(view.tooth); setTurnFilter(view.turn); }}>{v4("rmtApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropRemontoireView(views, view.id))}>{v4("rmtToothView")}</button>
          </span>
        ))}
      </form>
      <div className="c4-remontoire-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkRemontoireSpin(cards, picked))}>{v4("rmtBulkSpin")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkRemontoireGraphite(cards, picked))}>{v4("rmtBulkGraphite")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkRemontoireLocker(cards, picked))}>{v4("rmtBulkLocker")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkRemontoireTag(cards, picked))}>{v4("rmtBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("remontoire-rules.csv", remontoireCsv(shown, desk))}>{v4("rmtCsv")}</button>
      </div>
      <p className="c4-remontoire-keys">{v4("rmtKeys")} j k / p o u d m c a s v x</p>
      {!shown.length && <p className="c4-pay-empty">{v4("rmtEmpty")}</p>}
      <ul className="c4-remontoire-list" data-density={density}>
        {shown.map((card) => {
          const auditKey = AUDIT_KEY[card.audit];
          return (
            <li key={card.id} className="c4-remontoire-card" data-on={focused?.id === card.id ? "1" : "0"} data-piece={card.piece || "blank"} data-late={lateRemontoire(card, desk) ? "1" : "0"} data-idle={idleRemontoire(card) ? "1" : "0"} data-brisk={briskRemontoire(card) ? "1" : "0"} data-resting={restingRemontoire(card) ? "1" : "0"} data-overdue={overdueRemontoire(card) ? "1" : "0"} data-inner={remontoireInner(card.piece) ? "1" : "0"} data-outer={remontoireOuter(card.piece) ? "1" : "0"}>
              <label className="c4-remontoire-pick">
                <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
              </label>
              <div>
                <input className="c4-field" aria-label={v4("rmtEdit")} aria-required={false} defaultValue={card.title} disabled={viewer} onBlur={(event) => store(editRemontoire(cards, card.id, event.target.value))} />
                <input className="c4-field" aria-label={v4("rmtNote")} aria-required={false} defaultValue={card.note} disabled={viewer} onBlur={(event) => store(editRemontoireNote(cards, card.id, event.target.value))} />
                <p className="c4-remontoire-meta">{card.smith || "—"} · {pieceLabel(v4, card.piece)} · {inkLabel(v4, card.ink)} · {card.tooth ?? "—"} · {card.turn} · {card.tags.join(" ") || "—"}</p>
                {auditKey && <p className="c4-remontoire-audit">{v4(auditKey)}</p>}
              </div>
              <div className="c4-remontoire-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setRemontoireSpin(cards, card.id, !card.spun))}>{card.spun ? v4("rmtClear") : v4("rmtSpin")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setRemontoireInk(cards, card.id, suggested))}>{v4("rmtSuggest")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setRemontoireClick(cards, card.id, !card.clicked))}>{card.clicked ? v4("rmtUnhook") : v4("rmtClickIt")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setRemontoireLocker(cards, card.id, !card.boxed))}>{card.boxed ? v4("rmtUncoffer") : v4("rmtLockerIt")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setRemontoireStar(cards, card.id, !card.starred))}>{card.starred ? v4("rmtUnstar") : v4("rmtStar")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addRemontoireTag(cards, card.id, "w"))}>{v4("rmtTag")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(liftToothFocused(cards, card.id))}>{v4("rmtLift")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerToothFocused(cards, card.id))}>{v4("rmtLower")}</button>
                <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(remontoireCopy(card))}>{v4("rmtCopy")}</button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

type RhumbUser = { id?: string; name?: string | null; assigneeName?: string | null };

export function RhumbPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: RhumbUser[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<RhumbShape>("all");
  const [review, setReview] = useState<RhumbReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): RhumbRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      code: { owner: textField(row.assigneeName) } satisfies RhumbValue,
    };
  }).filter((row): row is RhumbRow => Boolean(row));
  const present = presentRhumbLanes(rows);
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
    const next = readHiddenRhumb(readJson(RHB_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(RHB_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedRhumb(readJson(RHB_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(RHB_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleRhumbLanes(present, hidden, showHidden);
  const shown = visibleRhumb(rows, lanes.includes(lane) || lane === "all" ? lane : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = rhumbLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = rhumbLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingRhumb(rows);
  const leadHue = leadingRhumbHue(rows);
  const whole = rows.filter((row) => rhumbLane(row.code)).length;
  const share = rhumbShare(laneRhumbCount(rows, "house"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("rhumb-lanes.csv", rhumbLanesCsv(rows));
        return;
      }
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [rows]);

  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(RHB_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(RHB_REVIEW_KEY, next);
  }

  return (
    <section className="c4-rhumb" aria-label={v4("rhbTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-rhumb-mast">
        <p className="c4-rhumb-seal" data-logo="mono">{v4("rhbLogo")}</p>
        <div>
          <p className="c4-rhumb-kicker">{v4("rhbSub")}</p>
          <h2 className="c4-title">{v4("rhbTitle")}</h2>
        </div>
        <p className="c4-rhumb-count">{shown.length}</p>
      </header>
      <p className="c4-rhumb-links">
        <Link href={crmv4Href(base, "rmt")}>{v4("rmtTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("rhbCustomer")}</Link>
      </p>
      <p className="c4-rhumb-hint">{v4("rhbHint")}</p>
      {viewer && <p className="c4-rhumb-note">{v4("rhbViewer")}</p>}
      <p className="c4-rhumb-meta">{v4("rhbLead")} {laneLabel(v4, lead)} · {v4("rhbToneLead")} {hueLabel(v4, leadHue)} · {v4("rhbShare")} {share}</p>
      <div className="c4-rhumb-chart" aria-label={v4("rhbChart")}>
        {lines.map((line) => (
          <button key={line.lane} type="button" className="c4-rhumb-column" data-on={lane === line.lane ? "1" : "0"} data-lane={line.lane} onClick={() => setLane(lane === line.lane ? "all" : line.lane)}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-rhumb-tools">
        <input ref={searchRef} className="c4-field c4-rhumb-search" aria-label={v4("rhbSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("rhbSearch")} />
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("rhbShow")}</button>
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{v4(item === "all" ? "rhbAll" : item === "reviewed" ? "rhbReviewed" : "rhbFresh")}</button>
        ))}
        {(["all", "champagne", "ivory", "graphite"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("rhbAll") : hueLabel(v4, item)}</button>
        ))}
        {(Object.keys(SHAPE_KEY) as RhumbShape[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" onClick={() => storeHidden(toggleRhumb(hidden, item))}>{hidden.includes(item) ? v4("rhbShow") : v4("rhbHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-rhumb-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkRhumbReview(reviewed, picked, true))}>{v4("rhbBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkRhumbReview(reviewed, picked, false))}>{v4("rhbBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("rhumb-lanes.csv", rhumbLanesCsv(rows))}>{v4("rhbCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("rhumb-rows.csv", rhumbRowsCsv(shown, reviewed))}>{v4("rhbRowCsv")}</button>
      </div>
      {queue.loading && !rows.length && <p className="c4-meta">{v4("rhbLoading")}</p>}
      {queue.error && <p className="c4-meta">{v4("rhbFailed")}</p>}
      {!queue.loading && !queue.error && !rows.length && <p className="c4-pay-empty">{v4("rhbEmpty")}</p>}
      <ul className="c4-rhumb-list">
        {shown.map((row) => {
          const name = rhumbCopy(row.code);
          const tone = rhumbHue(row.code);
          return (
            <li key={row.id} className="c4-rhumb-card" data-lane={rhumbLane(row.code) || "open"} data-hue={tone || "none"} data-house={rhumbHouseSafe(row.code)} data-open={rhumbOpen(row.code) ? "1" : "0"} data-even={rhumbEven(row.code) ? "1" : "0"} data-digit={rhumbDigit(row.code) ? "1" : "0"} data-letter={rhumbLetter(row.code) ? "1" : "0"} data-mixed={rhumbMixed(row.code) ? "1" : "0"} data-upper={rhumbUpper(row.code) ? "1" : "0"} data-lower={rhumbLower(row.code) ? "1" : "0"} data-space={rhumbSpace(row.code) ? "1" : "0"} data-vowel={rhumbVowel(row.code) ? "1" : "0"} data-tail={rhumbTail(row.code) ? "1" : "0"} data-first={rhumbFirst(row.code) ? "1" : "0"} data-held={rhumbHeld(row.code) ? "1" : "0"} data-hyphen={rhumbHyphen(row.code) ? "1" : "0"} data-period={rhumbPeriod(row.code) ? "1" : "0"} data-capital={rhumbCapital(row.code) ? "1" : "0"} data-join={rhumbJoin(row.code) ? "1" : "0"} data-span={rhumbSpan(row.code) ? "1" : "0"}>
              <label className="c4-rhumb-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-rhumb-meta">{name || v4("rhbOpen")} · {rhumbStamp(row.code) || "—"} · {rhumbFamily(row.code) || "—"} · {rhumbLength(row.code) ?? "—"} · {laneLabel(v4, rhumbLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-rhumb-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleRhumbReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("rhbReviewed") : v4("rhbReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const text = rhumbCopy(row.code); if (!text) return; navigator.clipboard?.writeText(text); setCopied(row.id); }}>{copied === row.id ? v4("rhbCopied") : v4("rhbCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("rhbCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function rhumbHouseSafe(raw: RhumbValue): string {
  return rhumbLane(raw) === "house" ? "1" : "0";
}
