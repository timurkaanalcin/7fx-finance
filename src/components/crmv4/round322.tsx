"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  TRB_DENSITY_KEY,
  TRB_KEY,
  TRB_PIECES,
  TRB_VIEW_KEY,
  ISG_KEY,
  ISG_REVIEW_KEY,
  addTourbillon,
  addTourbillonTag,
  addTourbillonView,
  briskTourbillon,
  bulkTourbillonLocker,
  bulkTourbillonGraphite,
  bulkTourbillonSpin,
  bulkTourbillonTag,
  bulkIsogonicReview,
  busiestSmith,
  tourbillonBars,
  tourbillonCopy,
  tourbillonCounts,
  tourbillonCsv,
  tourbillonDensity,
  tourbillonInner,
  tourbillonSmiths,
  tourbillonOuter,
  tourbillonTimeline,
  dropTourbillonView,
  editTourbillon,
  editTourbillonNote,
  fairSmith,
  idleTourbillon,
  inkFocused,
  laneIsogonicCount,
  lateTourbillon,
  leadingIsogonic,
  leadingIsogonicHue,
  liftToothFocused,
  lowerTurnFocused,
  lowerToothFocused,
  moveTourbillonFocus,
  overdueTourbillon,
  hookTourbillonFocused,
  isogonicSpan,
  isogonicCapital,
  isogonicJoin,
  isogonicDigit,
  isogonicCopy,
  isogonicEven,
  isogonicFamily,
  isogonicFirst,
  isogonicHeld,
  isogonicHue,
  isogonicHyphen,
  isogonicLane,
  isogonicLanes,
  isogonicLanesCsv,
  isogonicLength,
  isogonicLetter,
  isogonicLower,
  isogonicMixed,
  isogonicVowel,
  isogonicOpen,
  isogonicPeriod,
  isogonicRowsCsv,
  isogonicShare,
  isogonicSpace,
  isogonicStamp,
  isogonicTail,
  isogonicUpper,
  presentIsogonicLanes,
  raiseTurnFocused,
  readTourbillonRules,
  readTourbillonViews,
  readHiddenIsogonic,
  readReviewedIsogonic,
  reminderTourbillonRules,
  restingTourbillon,
  setTourbillonLocker,
  setTourbillonFocused,
  setTourbillonInk,
  setTourbillonClick,
  setTourbillonSpin,
  setTourbillonStar,
  sortTourbillonRules,
  starTourbillonFocused,
  suggestTooth,
  suggestInk,
  suggestPiece,
  toggleIsogonic,
  toggleIsogonicReview,
  visibleTourbillonRules,
  visibleIsogonic,
  visibleIsogonicLanes,
  type Tourbillon,
  type TourbillonDensity,
  type TourbillonSort,
  type TourbillonTray,
  type TourbillonView,
  type IsogonicReview,
  type IsogonicRow,
  type IsogonicShape,
  type IsogonicValue,
} from "@/lib/crmv4/round322";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const INKS = ["GILT", "IVORY", "GRAPHITE"] as const;
const DROPS = ["2", "5", "8", "11"] as const;
const BEATS = ["3", "6", "9"] as const;

const VESSEL_KEY: Record<string, CrmV4CopyKey> = {
  cage: "trbCage",
  staff: "trbStaff",
  bridge: "trbBridge",
  jewel: "trbJewel",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "trbAuditSave",
  edit: "trbAuditEdit",
  note: "trbAuditNote",
  ink: "trbAuditInk",
  set: "trbAuditSet",
  clear: "trbAuditClear",
  latch: "trbAuditClick",
  resume: "trbAuditResume",
  coffer: "trbAuditLocker",
  open: "trbAuditOpen",
  tag: "trbAuditTag",
  turn: "trbAuditTurn",
  tooth: "trbAuditTooth",
  lower: "trbAuditLowerTooth",
  star: "trbAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  house: "isgHouse",
  join: "isgJoin",
  span: "isgSpan",
  digit: "isgDigit",
  stub: "isgStub",
  scroll: "isgScroll",
  vowel: "isgVowel",
  path: "isgPath",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "isgChampagne",
  ivory: "isgIvory",
  graphite: "isgGraphite",
};

const SHAPE_KEY: Record<IsogonicShape, CrmV4CopyKey> = {
  all: "isgShapeAll",
  house: "isgShapeHouse",
  join: "isgShapeJoin",
  span: "isgShapeSpan",
  digit: "isgShapeDigit",
  stub: "isgShapeStub",
  scroll: "isgShapeScroll",
  vowel: "isgShapeVowel",
  path: "isgShapePath",
  open: "isgShapeOpen",
  soon: "isgShapeSoon",
  letter: "isgShapeLetter",
  mixed: "isgShapeMixed",
  upper: "isgShapeUpper",
  lower: "isgShapeLower",
  space: "isgShapeSpace",
  even: "isgShapeEven",
  odd: "isgShapeOdd",
  tail: "isgShapeTail",
  first: "isgShapeFirst",
  held: "isgShapeHeld",
  hyphen: "isgShapeHyphen",
  period: "isgShapePeriod",
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
  return key ? v4(key) : v4("trbBlankPiece");
}

function inkLabel(v4: V4, ink: string): string {
  if (ink === "GILT") return v4("trbGilt");
  if (ink === "IVORY") return v4("trbIvory");
  if (ink === "GRAPHITE") return v4("trbGraphite");
  return v4("trbAll");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("isgBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("isgBlank");
}

export function TourbillonRules({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Tourbillon[]>([]);
  const [views, setViews] = useState<TourbillonView[]>([]);
  const [density, setDensity] = useState<TourbillonDensity>("broad");
  const [tray, setTray] = useState<TourbillonTray>("barrel");
  const [query, setQuery] = useState("");
  const [smithFilter, setSmithFilter] = useState("");
  const [inkFilter, setInkFilter] = useState("all");
  const [pieceFilter, setPieceFilter] = useState("all");
  const [dropFilter, setToothFilter] = useState("all");
  const [beatFilter, setTurnFilter] = useState("all");
  const [sort, setSort] = useState<TourbillonSort>("piece");
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
  const [desk, setDesk] = useState("cage");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readTourbillonRules(readJson(TRB_KEY, [])));
    setViews(readTourbillonViews(readJson(TRB_VIEW_KEY, [])));
    setDensity(tourbillonDensity(readJson(TRB_DENSITY_KEY, "broad")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Tourbillon[]) {
    setCards(next);
    writeJson(TRB_KEY, next);
  }
  function storeViews(next: TourbillonView[]) {
    setViews(next);
    writeJson(TRB_VIEW_KEY, next);
  }
  function storeDensity(next: TourbillonDensity) {
    setDensity(next);
    writeJson(TRB_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortTourbillonRules(visibleTourbillonRules(cards, tray, query, smithFilter, inkFilter, pieceFilter, dropFilter, beatFilter), sort),
    [cards, tray, query, smithFilter, inkFilter, pieceFilter, dropFilter, beatFilter, sort],
  );
  const counts = tourbillonCounts(cards, shown, desk);
  const bars = tourbillonBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = tourbillonTimeline(cards);
  const smiths = tourbillonSmiths(cards);
  const suggested = suggestInk(cards);
  const fair = fairSmith(cards, smiths.join(","));
  const busy = busiestSmith(cards);
  const reminders = reminderTourbillonRules(cards);
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
        setFocusAt((index) => moveTourbillonFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocusAt((index) => moveTourbillonFocus(index, shown.length, -1));
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
        store(setTourbillonLocker(cards, id, !shown[focusAt]?.boxed));
        return;
      }
      if (event.key === "m" || event.key === "M") {
        event.preventDefault();
        store(inkFocused(cards, id));
        return;
      }
      if (event.key === "c" || event.key === "C") {
        event.preventDefault();
        store(hookTourbillonFocused(cards, id));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        store(setTourbillonFocused(cards, id));
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("tourbillon-rules.csv", tourbillonCsv(shown, desk));
        return;
      }
      if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        store(starTourbillonFocused(cards, id));
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
    <section className="c4-tourbillon" aria-label={v4("trbTitle")} data-cards="1" data-desk={tray} data-names="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-tourbillon-mast">
        <p className="c4-tourbillon-seal" data-logo="mono">{v4("trbLogo")}</p>
        <div>
          <p className="c4-tourbillon-kicker">{v4("trbSub")}</p>
          <h2 className="c4-title">{v4("trbTitle")}</h2>
        </div>
        <p className="c4-tourbillon-count">{counts.matched}</p>
      </header>
      <ol className="c4-tourbillon-index" aria-label={v4("trbTitle")}>
        <li data-tone="gold">{v4("trbArbor")} {counts.bench}</li>
        <li data-tone="ink">{v4("trbOverdue")} {counts.overdue}</li>
        <li data-tone="ivory">{v4("trbHouse")} {counts.house}</li>
      </ol>
      <p className="c4-tourbillon-links">
        <Link href={crmv4Href(base, "isg")}>{v4("isgTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("trbCustomers")}</Link>
      </p>
      <p className="c4-tourbillon-hint">{v4("trbHint")}</p>
      {viewer && <p className="c4-tourbillon-note">{v4("trbViewer")}</p>}
      {counts.overdue > 0 && <p className="c4-tourbillon-notice" role="status">{v4("trbOverdue")} {counts.overdue}</p>}
      <ol className="c4-tourbillon-dials" aria-label={v4("trbChart")}>
        <li>{v4("trbArbor")} {counts.bench}</li>
        <li>{v4("trbClick")} {counts.click}</li>
        <li>{v4("trbLocker")} {counts.locker}</li>
        <li>{v4("trbInner")} {counts.inner}</li>
        <li>{v4("trbOuter")} {counts.outer}</li>
        <li>{v4("trbWide")} {counts.wide}</li>
        <li>{v4("trbStar")} {counts.starred}</li>
        <li>{v4("trbIdle")} {counts.idle}</li>
        <li>{v4("trbBrisk")} {counts.brisk}</li>
        <li>{v4("trbResting")} {counts.resting}</li>
      </ol>
      <div className="c4-tourbillon-chart" aria-label={v4("trbChart")}>
        {bars.map((bar) => (
          <button key={bar.piece} type="button" className="c4-tourbillon-column" data-on={pieceFilter === bar.piece ? "1" : "0"} data-piece={bar.piece} onClick={() => setPieceFilter(pieceFilter === bar.piece ? "all" : bar.piece)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{pieceLabel(v4, bar.piece)}</span>
          </button>
        ))}
      </div>
      <div className="c4-tourbillon-tools">
        <input ref={searchRef} className="c4-field c4-tourbillon-search" aria-label={v4("trbSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("trbSearch")} />
        {(["barrel", "latch", "coffer"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "barrel" ? "trbArbor" : item === "latch" ? "trbClick" : "trbLocker")}</button>
        ))}
        {(["all", "inner", "outer", ...TRB_PIECES] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={pieceFilter === item ? "1" : "0"} onClick={() => setPieceFilter(item)}>{item === "all" ? v4("trbAll") : item === "inner" ? v4("trbInner") : item === "outer" ? v4("trbOuter") : pieceLabel(v4, item)}</button>
        ))}
        {(["all", ...INKS] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={inkFilter === item ? "1" : "0"} onClick={() => setInkFilter(item)}>{item === "all" ? v4("trbAll") : inkLabel(v4, item)}</button>
        ))}
        {(["all", ...DROPS] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={dropFilter === item ? "1" : "0"} onClick={() => setToothFilter(item)}>{item === "all" ? v4("trbTooth") : item}</button>
        ))}
        {(["all", ...BEATS] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={beatFilter === item ? "1" : "0"} onClick={() => setTurnFilter(item)}>{item === "all" ? v4("trbTurn") : item}</button>
        ))}
        <button type="button" className="c4-chip" data-on={sort === "piece" ? "1" : "0"} onClick={() => setSort("piece")}>{v4("trbSortPiece")}</button>
        <button type="button" className="c4-chip" data-on={sort === "smith" ? "1" : "0"} onClick={() => setSort("smith")}>{v4("trbSortSmith")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "broad" : "tight")}>{density === "tight" ? v4("trbTight") : v4("trbBroad")}</button>
        {TRB_PIECES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={desk === item ? "1" : "0"} onClick={() => setDesk(item)}>{v4("trbDesk")} {pieceLabel(v4, item)}</button>
        ))}
        {smiths.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={smithFilter === name ? "1" : "0"} onClick={() => setSmithFilter(smithFilter === name ? "" : name)}>{name}</button>
        ))}
      </div>
      <p className="c4-tourbillon-meta">{v4("trbSuggest")} {inkLabel(v4, suggested)} · {dropHint} · {pieceLabel(v4, pieceHint)} · {v4("trbFair")} {fair || "—"} · {v4("trbBusy")} {busy || "—"}</p>
      {reminders.length > 0 && (
        <ul className="c4-tourbillon-remind" aria-label={v4("trbRemind")}>
          {reminders.map((item) => <li key={item}>{item}</li>)}
        </ul>
      )}
      {timeline.length > 0 && (
        <ol className="c4-tourbillon-time" aria-label={v4("trbTimeline")}>
          {timeline.map((lane) => <li key={lane.tooth}>{lane.tooth} · {lane.titles.join(" · ")}</li>)}
        </ol>
      )}
      <form className="c4-tourbillon-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addTourbillon(cards, { title, note, smith, piece, ink, tooth: dropNo, turn: beatNo, tags });
        if (next.length === cards.length) return;
        store(next);
        setTitle("");
        setNote("");
        setTags("");
      }}>
        <input className="c4-field" aria-label={v4("trbEdit")} aria-required={false} value={title} onChange={(event) => setTitle(event.target.value)} placeholder={v4("trbEdit")} disabled={viewer} />
        <input className="c4-field" aria-label={v4("trbNote")} aria-required={false} value={note} onChange={(event) => setNote(event.target.value)} placeholder={v4("trbNote")} disabled={viewer} />
        <input className="c4-field" aria-label={v4("trbSmith")} aria-required={false} value={smith} onChange={(event) => setSmith(event.target.value)} placeholder={v4("trbSmith")} disabled={viewer} />
        <select className="c4-select" aria-label={v4("trbDesk")} value={piece} onChange={(event) => setPiece(event.target.value)} disabled={viewer}>
          <option value="">{v4("trbBlankPiece")}</option>
          {TRB_PIECES.map((item) => <option key={item} value={item}>{pieceLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("trbInk")} value={ink} onChange={(event) => setInk(event.target.value)} disabled={viewer}>
          <option value="">{v4("trbInk")}</option>
          {INKS.map((item) => <option key={item} value={item}>{inkLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("trbTooth")} value={dropNo} onChange={(event) => setToothNo(event.target.value)} disabled={viewer}>
          <option value="">{v4("trbTooth")}</option>
          {DROPS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("trbTurn")} value={beatNo} onChange={(event) => setTurnNo(event.target.value)} disabled={viewer}>
          <option value="">{v4("trbTurn")}</option>
          {BEATS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <input className="c4-field" aria-label={v4("trbTag")} aria-required={false} value={tags} onChange={(event) => setTags(event.target.value)} placeholder={v4("trbTag")} disabled={viewer} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("trbAdd")}</button>
      </form>
      <form className="c4-tourbillon-views" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addTourbillonView(views, { id: `v${Date.now().toString(36)}`, name: viewName, tray, query, smith: smithFilter, ink: inkFilter, piece: pieceFilter, tooth: dropFilter, turn: beatFilter });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <input className="c4-field" aria-label={v4("trbViewName")} aria-required={false} value={viewName} onChange={(event) => setViewName(event.target.value)} placeholder={v4("trbViewName")} disabled={viewer} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("trbSaveView")}</button>
        {views.map((view) => (
          <span key={view.id} className="c4-tourbillon-view">
            <button type="button" className="c4-chip" onClick={() => { setTray(view.tray); setQuery(view.query); setSmithFilter(view.smith); setInkFilter(view.ink); setPieceFilter(view.piece); setToothFilter(view.tooth); setTurnFilter(view.turn); }}>{v4("trbApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropTourbillonView(views, view.id))}>{v4("trbToothView")}</button>
          </span>
        ))}
      </form>
      <div className="c4-tourbillon-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkTourbillonSpin(cards, picked))}>{v4("trbBulkSpin")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkTourbillonGraphite(cards, picked))}>{v4("trbBulkGraphite")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkTourbillonLocker(cards, picked))}>{v4("trbBulkLocker")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkTourbillonTag(cards, picked))}>{v4("trbBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("tourbillon-rules.csv", tourbillonCsv(shown, desk))}>{v4("trbCsv")}</button>
      </div>
      <p className="c4-tourbillon-keys">{v4("trbKeys")} j k / p o u d m c a s v x</p>
      {!shown.length && <p className="c4-pay-empty">{v4("trbEmpty")}</p>}
      <ul className="c4-tourbillon-list" data-density={density}>
        {shown.map((card) => {
          const auditKey = AUDIT_KEY[card.audit];
          return (
            <li key={card.id} className="c4-tourbillon-card" data-on={focused?.id === card.id ? "1" : "0"} data-piece={card.piece || "blank"} data-late={lateTourbillon(card, desk) ? "1" : "0"} data-idle={idleTourbillon(card) ? "1" : "0"} data-brisk={briskTourbillon(card) ? "1" : "0"} data-resting={restingTourbillon(card) ? "1" : "0"} data-overdue={overdueTourbillon(card) ? "1" : "0"} data-inner={tourbillonInner(card.piece) ? "1" : "0"} data-outer={tourbillonOuter(card.piece) ? "1" : "0"}>
              <label className="c4-tourbillon-pick">
                <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
              </label>
              <div>
                <input className="c4-field" aria-label={v4("trbEdit")} aria-required={false} defaultValue={card.title} disabled={viewer} onBlur={(event) => store(editTourbillon(cards, card.id, event.target.value))} />
                <input className="c4-field" aria-label={v4("trbNote")} aria-required={false} defaultValue={card.note} disabled={viewer} onBlur={(event) => store(editTourbillonNote(cards, card.id, event.target.value))} />
                <p className="c4-tourbillon-meta">{card.smith || "—"} · {pieceLabel(v4, card.piece)} · {inkLabel(v4, card.ink)} · {card.tooth ?? "—"} · {card.turn} · {card.tags.join(" ") || "—"}</p>
                {auditKey && <p className="c4-tourbillon-audit">{v4(auditKey)}</p>}
              </div>
              <div className="c4-tourbillon-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTourbillonSpin(cards, card.id, !card.spun))}>{card.spun ? v4("trbClear") : v4("trbSpin")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTourbillonInk(cards, card.id, suggested))}>{v4("trbSuggest")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTourbillonClick(cards, card.id, !card.clicked))}>{card.clicked ? v4("trbUnhook") : v4("trbClickIt")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTourbillonLocker(cards, card.id, !card.boxed))}>{card.boxed ? v4("trbUncoffer") : v4("trbLockerIt")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTourbillonStar(cards, card.id, !card.starred))}>{card.starred ? v4("trbUnstar") : v4("trbStar")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addTourbillonTag(cards, card.id, "c"))}>{v4("trbTag")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(liftToothFocused(cards, card.id))}>{v4("trbLift")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerToothFocused(cards, card.id))}>{v4("trbLower")}</button>
                <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(tourbillonCopy(card))}>{v4("trbCopy")}</button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

type IsogonicUser = { id?: string; name?: string | null; brokerName?: string | null };

export function IsogonicPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: IsogonicUser[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<IsogonicShape>("all");
  const [review, setReview] = useState<IsogonicReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): IsogonicRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      code: { broker: textField(row.brokerName) } satisfies IsogonicValue,
    };
  }).filter((row): row is IsogonicRow => Boolean(row));
  const present = presentIsogonicLanes(rows);
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
    const next = readHiddenIsogonic(readJson(ISG_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(ISG_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedIsogonic(readJson(ISG_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(ISG_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleIsogonicLanes(present, hidden, showHidden);
  const shown = visibleIsogonic(rows, lanes.includes(lane) || lane === "all" ? lane : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = isogonicLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = isogonicLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingIsogonic(rows);
  const leadHue = leadingIsogonicHue(rows);
  const whole = rows.filter((row) => isogonicLane(row.code)).length;
  const share = isogonicShare(laneIsogonicCount(rows, "house"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("isogonic-lanes.csv", isogonicLanesCsv(rows));
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
    writeJson(ISG_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(ISG_REVIEW_KEY, next);
  }

  return (
    <section className="c4-isogonic" aria-label={v4("isgTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-isogonic-mast">
        <p className="c4-isogonic-seal" data-logo="mono">{v4("isgLogo")}</p>
        <div>
          <p className="c4-isogonic-kicker">{v4("isgSub")}</p>
          <h2 className="c4-title">{v4("isgTitle")}</h2>
        </div>
        <p className="c4-isogonic-count">{shown.length}</p>
      </header>
      <p className="c4-isogonic-links">
        <Link href={crmv4Href(base, "trb")}>{v4("trbTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("isgCustomer")}</Link>
      </p>
      <p className="c4-isogonic-hint">{v4("isgHint")}</p>
      {viewer && <p className="c4-isogonic-note">{v4("isgViewer")}</p>}
      <p className="c4-isogonic-meta">{v4("isgLead")} {laneLabel(v4, lead)} · {v4("isgToneLead")} {hueLabel(v4, leadHue)} · {v4("isgShare")} {share}</p>
      <div className="c4-isogonic-chart" aria-label={v4("isgChart")}>
        {lines.map((line) => (
          <button key={line.lane} type="button" className="c4-isogonic-column" data-on={lane === line.lane ? "1" : "0"} data-lane={line.lane} onClick={() => setLane(lane === line.lane ? "all" : line.lane)}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-isogonic-tools">
        <input ref={searchRef} className="c4-field c4-isogonic-search" aria-label={v4("isgSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("isgSearch")} />
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("isgShow")}</button>
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{v4(item === "all" ? "isgAll" : item === "reviewed" ? "isgReviewed" : "isgFresh")}</button>
        ))}
        {(["all", "champagne", "ivory", "graphite"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("isgAll") : hueLabel(v4, item)}</button>
        ))}
        {(Object.keys(SHAPE_KEY) as IsogonicShape[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" onClick={() => storeHidden(toggleIsogonic(hidden, item))}>{hidden.includes(item) ? v4("isgShow") : v4("isgHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-isogonic-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkIsogonicReview(reviewed, picked, true))}>{v4("isgBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkIsogonicReview(reviewed, picked, false))}>{v4("isgBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("isogonic-lanes.csv", isogonicLanesCsv(rows))}>{v4("isgCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("isogonic-rows.csv", isogonicRowsCsv(shown, reviewed))}>{v4("isgRowCsv")}</button>
      </div>
      {queue.loading && !rows.length && <p className="c4-meta">{v4("isgLoading")}</p>}
      {queue.error && <p className="c4-meta">{v4("isgFailed")}</p>}
      {!queue.loading && !queue.error && !rows.length && <p className="c4-pay-empty">{v4("isgEmpty")}</p>}
      <ul className="c4-isogonic-list">
        {shown.map((row) => {
          const name = isogonicCopy(row.code);
          const tone = isogonicHue(row.code);
          return (
            <li key={row.id} className="c4-isogonic-card" data-lane={isogonicLane(row.code) || "open"} data-hue={tone || "none"} data-house={isogonicHouseSafe(row.code)} data-open={isogonicOpen(row.code) ? "1" : "0"} data-even={isogonicEven(row.code) ? "1" : "0"} data-digit={isogonicDigit(row.code) ? "1" : "0"} data-letter={isogonicLetter(row.code) ? "1" : "0"} data-mixed={isogonicMixed(row.code) ? "1" : "0"} data-upper={isogonicUpper(row.code) ? "1" : "0"} data-lower={isogonicLower(row.code) ? "1" : "0"} data-space={isogonicSpace(row.code) ? "1" : "0"} data-vowel={isogonicVowel(row.code) ? "1" : "0"} data-tail={isogonicTail(row.code) ? "1" : "0"} data-first={isogonicFirst(row.code) ? "1" : "0"} data-held={isogonicHeld(row.code) ? "1" : "0"} data-hyphen={isogonicHyphen(row.code) ? "1" : "0"} data-period={isogonicPeriod(row.code) ? "1" : "0"} data-capital={isogonicCapital(row.code) ? "1" : "0"} data-join={isogonicJoin(row.code) ? "1" : "0"} data-span={isogonicSpan(row.code) ? "1" : "0"}>
              <label className="c4-isogonic-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-isogonic-meta">{name || v4("isgOpen")} · {isogonicStamp(row.code) || "—"} · {isogonicFamily(row.code) || "—"} · {isogonicLength(row.code) ?? "—"} · {laneLabel(v4, isogonicLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-isogonic-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleIsogonicReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("isgReviewed") : v4("isgReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const text = isogonicCopy(row.code); if (!text) return; navigator.clipboard?.writeText(text); setCopied(row.id); }}>{copied === row.id ? v4("isgCopied") : v4("isgCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("isgCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function isogonicHouseSafe(raw: IsogonicValue): string {
  return isogonicLane(raw) === "house" ? "1" : "0";
}
