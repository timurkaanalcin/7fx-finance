"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  FSE_DENSITY_KEY,
  FSE_KEY,
  FSE_PIECES,
  FSE_VIEW_KEY,
  SNL_KEY,
  SNL_REVIEW_KEY,
  addFusee,
  addFuseeTag,
  addFuseeView,
  briskFusee,
  bulkFuseeLocker,
  bulkFuseeGraphite,
  bulkFuseeSpin,
  bulkFuseeTag,
  bulkSnailReview,
  busiestSmith,
  fuseeBars,
  fuseeCopy,
  fuseeCounts,
  fuseeCsv,
  fuseeDensity,
  fuseeInner,
  fuseeSmiths,
  fuseeOuter,
  fuseeTimeline,
  dropFuseeView,
  editFusee,
  editFuseeNote,
  fairSmith,
  idleFusee,
  inkFocused,
  laneSnailCount,
  lateFusee,
  leadingSnail,
  leadingSnailHue,
  liftToothFocused,
  lowerTurnFocused,
  lowerToothFocused,
  moveFuseeFocus,
  overdueFusee,
  hookFuseeFocused,
  snailSpan,
  snailCapital,
  snailJoin,
  snailDigit,
  snailCopy,
  snailEven,
  snailFamily,
  snailFirst,
  snailHeld,
  snailHue,
  snailHyphen,
  snailLane,
  snailLanes,
  snailLanesCsv,
  snailLength,
  snailLetter,
  snailLower,
  snailMixed,
  snailVowel,
  snailOpen,
  snailPeriod,
  snailRowsCsv,
  snailShare,
  snailSpace,
  snailStamp,
  snailTail,
  snailUpper,
  presentSnailLanes,
  raiseTurnFocused,
  readFuseeRules,
  readFuseeViews,
  readHiddenSnail,
  readReviewedSnail,
  reminderFuseeRules,
  restingFusee,
  setFuseeLocker,
  setFuseeFocused,
  setFuseeInk,
  setFuseeClick,
  setFuseeSpin,
  setFuseeStar,
  sortFuseeRules,
  starFuseeFocused,
  suggestTooth,
  suggestInk,
  suggestPiece,
  toggleSnail,
  toggleSnailReview,
  visibleFuseeRules,
  visibleSnail,
  visibleSnailLanes,
  type Fusee,
  type FuseeDensity,
  type FuseeSort,
  type FuseeTray,
  type FuseeView,
  type SnailReview,
  type SnailRow,
  type SnailShape,
  type SnailValue,
} from "@/lib/crmv4/round320";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const INKS = ["GILT", "IVORY", "GRAPHITE"] as const;
const DROPS = ["2", "5", "8", "11"] as const;
const BEATS = ["2", "6", "10"] as const;

const VESSEL_KEY: Record<string, CrmV4CopyKey> = {
  cone: "fseCone",
  chain: "fseChain",
  cam: "fseCam",
  stop: "fseStop",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "fseAuditSave",
  edit: "fseAuditEdit",
  note: "fseAuditNote",
  ink: "fseAuditInk",
  set: "fseAuditSet",
  clear: "fseAuditClear",
  click: "fseAuditClick",
  resume: "fseAuditResume",
  locker: "fseAuditLocker",
  open: "fseAuditOpen",
  tag: "fseAuditTag",
  turn: "fseAuditTurn",
  tooth: "fseAuditTooth",
  lower: "fseAuditLowerTooth",
  star: "fseAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  house: "snlHouse",
  join: "snlJoin",
  span: "snlSpan",
  digit: "snlDigit",
  stub: "snlStub",
  scroll: "snlScroll",
  vowel: "snlVowel",
  path: "snlPath",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "snlChampagne",
  ivory: "snlIvory",
  graphite: "snlGraphite",
};

const SHAPE_KEY: Record<SnailShape, CrmV4CopyKey> = {
  all: "snlShapeAll",
  house: "snlShapeHouse",
  join: "snlShapeJoin",
  span: "snlShapeSpan",
  digit: "snlShapeDigit",
  stub: "snlShapeStub",
  scroll: "snlShapeScroll",
  vowel: "snlShapeVowel",
  path: "snlShapePath",
  open: "snlShapeOpen",
  soon: "snlShapeSoon",
  letter: "snlShapeLetter",
  mixed: "snlShapeMixed",
  upper: "snlShapeUpper",
  lower: "snlShapeLower",
  space: "snlShapeSpace",
  even: "snlShapeEven",
  odd: "snlShapeOdd",
  tail: "snlShapeTail",
  first: "snlShapeFirst",
  held: "snlShapeHeld",
  hyphen: "snlShapeHyphen",
  period: "snlShapePeriod",
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
  return key ? v4(key) : v4("fseBlankPiece");
}

function inkLabel(v4: V4, ink: string): string {
  if (ink === "GILT") return v4("fseGilt");
  if (ink === "IVORY") return v4("fseIvory");
  if (ink === "GRAPHITE") return v4("fseGraphite");
  return v4("fseAll");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("snlBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("snlBlank");
}

export function FuseeRules({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Fusee[]>([]);
  const [views, setViews] = useState<FuseeView[]>([]);
  const [density, setDensity] = useState<FuseeDensity>("broad");
  const [tray, setTray] = useState<FuseeTray>("arbor");
  const [query, setQuery] = useState("");
  const [smithFilter, setSmithFilter] = useState("");
  const [inkFilter, setInkFilter] = useState("all");
  const [pieceFilter, setPieceFilter] = useState("all");
  const [dropFilter, setToothFilter] = useState("all");
  const [beatFilter, setTurnFilter] = useState("all");
  const [sort, setSort] = useState<FuseeSort>("piece");
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
  const [desk, setDesk] = useState("cone");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readFuseeRules(readJson(FSE_KEY, [])));
    setViews(readFuseeViews(readJson(FSE_VIEW_KEY, [])));
    setDensity(fuseeDensity(readJson(FSE_DENSITY_KEY, "broad")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Fusee[]) {
    setCards(next);
    writeJson(FSE_KEY, next);
  }
  function storeViews(next: FuseeView[]) {
    setViews(next);
    writeJson(FSE_VIEW_KEY, next);
  }
  function storeDensity(next: FuseeDensity) {
    setDensity(next);
    writeJson(FSE_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortFuseeRules(visibleFuseeRules(cards, tray, query, smithFilter, inkFilter, pieceFilter, dropFilter, beatFilter), sort),
    [cards, tray, query, smithFilter, inkFilter, pieceFilter, dropFilter, beatFilter, sort],
  );
  const counts = fuseeCounts(cards, shown, desk);
  const bars = fuseeBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = fuseeTimeline(cards);
  const smiths = fuseeSmiths(cards);
  const suggested = suggestInk(cards);
  const fair = fairSmith(cards, smiths.join(","));
  const busy = busiestSmith(cards);
  const reminders = reminderFuseeRules(cards);
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
        setFocusAt((index) => moveFuseeFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocusAt((index) => moveFuseeFocus(index, shown.length, -1));
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
        store(setFuseeLocker(cards, id, !shown[focusAt]?.boxed));
        return;
      }
      if (event.key === "m" || event.key === "M") {
        event.preventDefault();
        store(inkFocused(cards, id));
        return;
      }
      if (event.key === "c" || event.key === "C") {
        event.preventDefault();
        store(hookFuseeFocused(cards, id));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        store(setFuseeFocused(cards, id));
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("fusee-rules.csv", fuseeCsv(shown, desk));
        return;
      }
      if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        store(starFuseeFocused(cards, id));
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
    <section className="c4-fusee" aria-label={v4("fseTitle")} data-cards="1" data-desk={tray} data-names="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-fusee-mast">
        <p className="c4-fusee-seal" data-logo="mono">{v4("fseLogo")}</p>
        <div>
          <p className="c4-fusee-kicker">{v4("fseSub")}</p>
          <h2 className="c4-title">{v4("fseTitle")}</h2>
        </div>
        <p className="c4-fusee-count">{counts.matched}</p>
      </header>
      <ol className="c4-fusee-index" aria-label={v4("fseTitle")}>
        <li data-tone="gold">{v4("fseArbor")} {counts.bench}</li>
        <li data-tone="ink">{v4("fseOverdue")} {counts.overdue}</li>
        <li data-tone="ivory">{v4("fseHouse")} {counts.house}</li>
      </ol>
      <p className="c4-fusee-links">
        <Link href={crmv4Href(base, "snl")}>{v4("snlTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("fseCustomers")}</Link>
      </p>
      <p className="c4-fusee-hint">{v4("fseHint")}</p>
      {viewer && <p className="c4-fusee-note">{v4("fseViewer")}</p>}
      {counts.overdue > 0 && <p className="c4-fusee-notice" role="status">{v4("fseOverdue")} {counts.overdue}</p>}
      <ol className="c4-fusee-dials" aria-label={v4("fseChart")}>
        <li>{v4("fseArbor")} {counts.bench}</li>
        <li>{v4("fseClick")} {counts.click}</li>
        <li>{v4("fseLocker")} {counts.locker}</li>
        <li>{v4("fseInner")} {counts.inner}</li>
        <li>{v4("fseOuter")} {counts.outer}</li>
        <li>{v4("fseWide")} {counts.wide}</li>
        <li>{v4("fseStar")} {counts.starred}</li>
        <li>{v4("fseIdle")} {counts.idle}</li>
        <li>{v4("fseBrisk")} {counts.brisk}</li>
        <li>{v4("fseResting")} {counts.resting}</li>
      </ol>
      <div className="c4-fusee-chart" aria-label={v4("fseChart")}>
        {bars.map((bar) => (
          <button key={bar.piece} type="button" className="c4-fusee-column" data-on={pieceFilter === bar.piece ? "1" : "0"} data-piece={bar.piece} onClick={() => setPieceFilter(pieceFilter === bar.piece ? "all" : bar.piece)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{pieceLabel(v4, bar.piece)}</span>
          </button>
        ))}
      </div>
      <div className="c4-fusee-tools">
        <input ref={searchRef} className="c4-field c4-fusee-search" aria-label={v4("fseSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("fseSearch")} />
        {(["arbor", "click", "locker"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "arbor" ? "fseArbor" : item === "click" ? "fseClick" : "fseLocker")}</button>
        ))}
        {(["all", "inner", "outer", ...FSE_PIECES] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={pieceFilter === item ? "1" : "0"} onClick={() => setPieceFilter(item)}>{item === "all" ? v4("fseAll") : item === "inner" ? v4("fseInner") : item === "outer" ? v4("fseOuter") : pieceLabel(v4, item)}</button>
        ))}
        {(["all", ...INKS] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={inkFilter === item ? "1" : "0"} onClick={() => setInkFilter(item)}>{item === "all" ? v4("fseAll") : inkLabel(v4, item)}</button>
        ))}
        {(["all", ...DROPS] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={dropFilter === item ? "1" : "0"} onClick={() => setToothFilter(item)}>{item === "all" ? v4("fseTooth") : item}</button>
        ))}
        {(["all", ...BEATS] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={beatFilter === item ? "1" : "0"} onClick={() => setTurnFilter(item)}>{item === "all" ? v4("fseTurn") : item}</button>
        ))}
        <button type="button" className="c4-chip" data-on={sort === "piece" ? "1" : "0"} onClick={() => setSort("piece")}>{v4("fseSortPiece")}</button>
        <button type="button" className="c4-chip" data-on={sort === "smith" ? "1" : "0"} onClick={() => setSort("smith")}>{v4("fseSortSmith")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "broad" : "tight")}>{density === "tight" ? v4("fseTight") : v4("fseBroad")}</button>
        {FSE_PIECES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={desk === item ? "1" : "0"} onClick={() => setDesk(item)}>{v4("fseDesk")} {pieceLabel(v4, item)}</button>
        ))}
        {smiths.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={smithFilter === name ? "1" : "0"} onClick={() => setSmithFilter(smithFilter === name ? "" : name)}>{name}</button>
        ))}
      </div>
      <p className="c4-fusee-meta">{v4("fseSuggest")} {inkLabel(v4, suggested)} · {dropHint} · {pieceLabel(v4, pieceHint)} · {v4("fseFair")} {fair || "—"} · {v4("fseBusy")} {busy || "—"}</p>
      {reminders.length > 0 && (
        <ul className="c4-fusee-remind" aria-label={v4("fseRemind")}>
          {reminders.map((item) => <li key={item}>{item}</li>)}
        </ul>
      )}
      {timeline.length > 0 && (
        <ol className="c4-fusee-time" aria-label={v4("fseTimeline")}>
          {timeline.map((lane) => <li key={lane.tooth}>{lane.tooth} · {lane.titles.join(" · ")}</li>)}
        </ol>
      )}
      <form className="c4-fusee-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addFusee(cards, { title, note, smith, piece, ink, tooth: dropNo, turn: beatNo, tags });
        if (next.length === cards.length) return;
        store(next);
        setTitle("");
        setNote("");
        setTags("");
      }}>
        <input className="c4-field" aria-label={v4("fseEdit")} aria-required={false} value={title} onChange={(event) => setTitle(event.target.value)} placeholder={v4("fseEdit")} disabled={viewer} />
        <input className="c4-field" aria-label={v4("fseNote")} aria-required={false} value={note} onChange={(event) => setNote(event.target.value)} placeholder={v4("fseNote")} disabled={viewer} />
        <input className="c4-field" aria-label={v4("fseSmith")} aria-required={false} value={smith} onChange={(event) => setSmith(event.target.value)} placeholder={v4("fseSmith")} disabled={viewer} />
        <select className="c4-select" aria-label={v4("fseDesk")} value={piece} onChange={(event) => setPiece(event.target.value)} disabled={viewer}>
          <option value="">{v4("fseBlankPiece")}</option>
          {FSE_PIECES.map((item) => <option key={item} value={item}>{pieceLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("fseInk")} value={ink} onChange={(event) => setInk(event.target.value)} disabled={viewer}>
          <option value="">{v4("fseInk")}</option>
          {INKS.map((item) => <option key={item} value={item}>{inkLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("fseTooth")} value={dropNo} onChange={(event) => setToothNo(event.target.value)} disabled={viewer}>
          <option value="">{v4("fseTooth")}</option>
          {DROPS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("fseTurn")} value={beatNo} onChange={(event) => setTurnNo(event.target.value)} disabled={viewer}>
          <option value="">{v4("fseTurn")}</option>
          {BEATS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <input className="c4-field" aria-label={v4("fseTag")} aria-required={false} value={tags} onChange={(event) => setTags(event.target.value)} placeholder={v4("fseTag")} disabled={viewer} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("fseAdd")}</button>
      </form>
      <form className="c4-fusee-views" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addFuseeView(views, { id: `v${Date.now().toString(36)}`, name: viewName, tray, query, smith: smithFilter, ink: inkFilter, piece: pieceFilter, tooth: dropFilter, turn: beatFilter });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <input className="c4-field" aria-label={v4("fseViewName")} aria-required={false} value={viewName} onChange={(event) => setViewName(event.target.value)} placeholder={v4("fseViewName")} disabled={viewer} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("fseSaveView")}</button>
        {views.map((view) => (
          <span key={view.id} className="c4-fusee-view">
            <button type="button" className="c4-chip" onClick={() => { setTray(view.tray); setQuery(view.query); setSmithFilter(view.smith); setInkFilter(view.ink); setPieceFilter(view.piece); setToothFilter(view.tooth); setTurnFilter(view.turn); }}>{v4("fseApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropFuseeView(views, view.id))}>{v4("fseToothView")}</button>
          </span>
        ))}
      </form>
      <div className="c4-fusee-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkFuseeSpin(cards, picked))}>{v4("fseBulkSpin")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkFuseeGraphite(cards, picked))}>{v4("fseBulkGraphite")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkFuseeLocker(cards, picked))}>{v4("fseBulkLocker")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkFuseeTag(cards, picked))}>{v4("fseBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("fusee-rules.csv", fuseeCsv(shown, desk))}>{v4("fseCsv")}</button>
      </div>
      <p className="c4-fusee-keys">{v4("fseKeys")} j k / p o u d m c a s v x</p>
      {!shown.length && <p className="c4-pay-empty">{v4("fseEmpty")}</p>}
      <ul className="c4-fusee-list" data-density={density}>
        {shown.map((card) => {
          const auditKey = AUDIT_KEY[card.audit];
          return (
            <li key={card.id} className="c4-fusee-card" data-on={focused?.id === card.id ? "1" : "0"} data-piece={card.piece || "blank"} data-late={lateFusee(card, desk) ? "1" : "0"} data-idle={idleFusee(card) ? "1" : "0"} data-brisk={briskFusee(card) ? "1" : "0"} data-resting={restingFusee(card) ? "1" : "0"} data-overdue={overdueFusee(card) ? "1" : "0"} data-inner={fuseeInner(card.piece) ? "1" : "0"} data-outer={fuseeOuter(card.piece) ? "1" : "0"}>
              <label className="c4-fusee-pick">
                <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
              </label>
              <div>
                <input className="c4-field" aria-label={v4("fseEdit")} aria-required={false} defaultValue={card.title} disabled={viewer} onBlur={(event) => store(editFusee(cards, card.id, event.target.value))} />
                <input className="c4-field" aria-label={v4("fseNote")} aria-required={false} defaultValue={card.note} disabled={viewer} onBlur={(event) => store(editFuseeNote(cards, card.id, event.target.value))} />
                <p className="c4-fusee-meta">{card.smith || "—"} · {pieceLabel(v4, card.piece)} · {inkLabel(v4, card.ink)} · {card.tooth ?? "—"} · {card.turn} · {card.tags.join(" ") || "—"}</p>
                {auditKey && <p className="c4-fusee-audit">{v4(auditKey)}</p>}
              </div>
              <div className="c4-fusee-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setFuseeSpin(cards, card.id, !card.spun))}>{card.spun ? v4("fseClear") : v4("fseSpin")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setFuseeInk(cards, card.id, suggested))}>{v4("fseSuggest")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setFuseeClick(cards, card.id, !card.clicked))}>{card.clicked ? v4("fseUnhook") : v4("fseClickIt")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setFuseeLocker(cards, card.id, !card.boxed))}>{card.boxed ? v4("fseUncoffer") : v4("fseLockerIt")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setFuseeStar(cards, card.id, !card.starred))}>{card.starred ? v4("fseUnstar") : v4("fseStar")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addFuseeTag(cards, card.id, "q"))}>{v4("fseTag")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(liftToothFocused(cards, card.id))}>{v4("fseLift")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerToothFocused(cards, card.id))}>{v4("fseLower")}</button>
                <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(fuseeCopy(card))}>{v4("fseCopy")}</button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

type SnailUser = { id?: string; name?: string | null; lastUserAgent?: string | null };

export function SnailPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: SnailUser[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<SnailShape>("all");
  const [review, setReview] = useState<SnailReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): SnailRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      code: { agent: textField(row.lastUserAgent) } satisfies SnailValue,
    };
  }).filter((row): row is SnailRow => Boolean(row));
  const present = presentSnailLanes(rows);
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
    const next = readHiddenSnail(readJson(SNL_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(SNL_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedSnail(readJson(SNL_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(SNL_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleSnailLanes(present, hidden, showHidden);
  const shown = visibleSnail(rows, lanes.includes(lane) || lane === "all" ? lane : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = snailLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = snailLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingSnail(rows);
  const leadHue = leadingSnailHue(rows);
  const whole = rows.filter((row) => snailLane(row.code)).length;
  const share = snailShare(laneSnailCount(rows, "house"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("snail-lanes.csv", snailLanesCsv(rows));
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
    writeJson(SNL_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(SNL_REVIEW_KEY, next);
  }

  return (
    <section className="c4-snail" aria-label={v4("snlTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-snail-mast">
        <p className="c4-snail-seal" data-logo="mono">{v4("snlLogo")}</p>
        <div>
          <p className="c4-snail-kicker">{v4("snlSub")}</p>
          <h2 className="c4-title">{v4("snlTitle")}</h2>
        </div>
        <p className="c4-snail-count">{shown.length}</p>
      </header>
      <p className="c4-snail-links">
        <Link href={crmv4Href(base, "fse")}>{v4("fseTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("snlCustomer")}</Link>
      </p>
      <p className="c4-snail-hint">{v4("snlHint")}</p>
      {viewer && <p className="c4-snail-note">{v4("snlViewer")}</p>}
      <p className="c4-snail-meta">{v4("snlLead")} {laneLabel(v4, lead)} · {v4("snlToneLead")} {hueLabel(v4, leadHue)} · {v4("snlShare")} {share}</p>
      <div className="c4-snail-chart" aria-label={v4("snlChart")}>
        {lines.map((line) => (
          <button key={line.lane} type="button" className="c4-snail-column" data-on={lane === line.lane ? "1" : "0"} data-lane={line.lane} onClick={() => setLane(lane === line.lane ? "all" : line.lane)}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-snail-tools">
        <input ref={searchRef} className="c4-field c4-snail-search" aria-label={v4("snlSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("snlSearch")} />
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("snlShow")}</button>
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{v4(item === "all" ? "snlAll" : item === "reviewed" ? "snlReviewed" : "snlFresh")}</button>
        ))}
        {(["all", "champagne", "ivory", "graphite"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("snlAll") : hueLabel(v4, item)}</button>
        ))}
        {(Object.keys(SHAPE_KEY) as SnailShape[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" onClick={() => storeHidden(toggleSnail(hidden, item))}>{hidden.includes(item) ? v4("snlShow") : v4("snlHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-snail-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkSnailReview(reviewed, picked, true))}>{v4("snlBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkSnailReview(reviewed, picked, false))}>{v4("snlBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("snail-lanes.csv", snailLanesCsv(rows))}>{v4("snlCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("snail-rows.csv", snailRowsCsv(shown, reviewed))}>{v4("snlRowCsv")}</button>
      </div>
      {queue.loading && !rows.length && <p className="c4-meta">{v4("snlLoading")}</p>}
      {queue.error && <p className="c4-meta">{v4("snlFailed")}</p>}
      {!queue.loading && !queue.error && !rows.length && <p className="c4-pay-empty">{v4("snlEmpty")}</p>}
      <ul className="c4-snail-list">
        {shown.map((row) => {
          const name = snailCopy(row.code);
          const tone = snailHue(row.code);
          return (
            <li key={row.id} className="c4-snail-card" data-lane={snailLane(row.code) || "open"} data-hue={tone || "none"} data-house={snailHouseSafe(row.code)} data-open={snailOpen(row.code) ? "1" : "0"} data-even={snailEven(row.code) ? "1" : "0"} data-digit={snailDigit(row.code) ? "1" : "0"} data-letter={snailLetter(row.code) ? "1" : "0"} data-mixed={snailMixed(row.code) ? "1" : "0"} data-upper={snailUpper(row.code) ? "1" : "0"} data-lower={snailLower(row.code) ? "1" : "0"} data-space={snailSpace(row.code) ? "1" : "0"} data-vowel={snailVowel(row.code) ? "1" : "0"} data-tail={snailTail(row.code) ? "1" : "0"} data-first={snailFirst(row.code) ? "1" : "0"} data-held={snailHeld(row.code) ? "1" : "0"} data-hyphen={snailHyphen(row.code) ? "1" : "0"} data-period={snailPeriod(row.code) ? "1" : "0"} data-capital={snailCapital(row.code) ? "1" : "0"} data-join={snailJoin(row.code) ? "1" : "0"} data-span={snailSpan(row.code) ? "1" : "0"}>
              <label className="c4-snail-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-snail-meta">{name || v4("snlOpen")} · {snailStamp(row.code) || "—"} · {snailFamily(row.code) || "—"} · {snailLength(row.code) ?? "—"} · {laneLabel(v4, snailLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-snail-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleSnailReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("snlReviewed") : v4("snlReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const text = snailCopy(row.code); if (!text) return; navigator.clipboard?.writeText(text); setCopied(row.id); }}>{copied === row.id ? v4("snlCopied") : v4("snlCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("snlCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function snailHouseSafe(raw: SnailValue): string {
  return snailLane(raw) === "house" ? "1" : "0";
}
