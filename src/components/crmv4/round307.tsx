"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  UMB_KEY,
  UMB_REVIEW_KEY,
  TYM_QUARTERS,
  TYM_DENSITY_KEY,
  TYM_KEY,
  TYM_VIEW_KEY,
  addTympanTag,
  addTympanView,
  addTympan,
  briskTympan,
  bulkUmbraReview,
  bulkTympanVault,
  bulkTympanSighted,
  bulkTympanTag,
  bulkTympanEnamel,
  busiestSighter,
  dropTympanView,
  editTympanNote,
  editTympan,
  fairSighter,
  umbraCapital,
  umbraCopy,
  umbraDigit,
  umbraEven,
  umbraFamily,
  umbraFirst,
  umbraHeld,
  umbraHue,
  umbraHyphen,
  umbraLane,
  umbraLanes,
  umbraLanesCsv,
  umbraLength,
  umbraLetter,
  umbraLower,
  umbraMixed,
  umbraOpen,
  umbraPeriod,
  umbraRowsCsv,
  umbraShare,
  umbraSpace,
  umbraStamp,
  umbraTail,
  umbraUpper,
  umbraVowel,
  idleTympan,
  laneUmbraCount,
  lateTympan,
  leadingUmbra,
  leadingUmbraHue,
  liftSpanFocused,
  lowerPinFocused,
  lowerSpanFocused,
  moveTympanFocus,
  tympanBars,
  tympanCopy,
  tympanCounts,
  tympanCsv,
  tympanDensity,
  tympanInner,
  tympanOuter,
  tympanSighters,
  tympanTimeline,
  overdueTympan,
  presentUmbraLanes,
  raisePinFocused,
  readHiddenUmbras,
  readTympanViews,
  readTympanRules,
  readReviewedUmbras,
  reminderTympanRules,
  restingTympan,
  setTympanFocused,
  setTympanVault,
  setTympanSighted,
  setTympanSleeve,
  setTympanStar,
  setTympanCloth,
  sortTympanRules,
  starTympanFocused,
  suggestSpan,
  suggestQuarter,
  suggestFinish,
  toggleUmbra,
  toggleUmbraReview,
  visibleUmbraLanes,
  visibleUmbras,
  visibleTympanRules,
  finishFocused,
  sleeveTympanFocused,
  type UmbraReview,
  type UmbraRow,
  type UmbraShape,
  type UmbraValue,
  type TympanDensity,
  type TympanSort,
  type TympanTray,
  type TympanView,
  type Tympan,
} from "@/lib/crmv4/round307";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const FINISHES = ["BRASS", "SILVER", "ENAMEL"] as const;
const SPANS = ["15", "30", "45", "60"] as const;
const PINS = ["3", "6", "9"] as const;

const CLIMATE_KEY: Record<string, CrmV4CopyKey> = {
  tropic: "tymTropic",
  temperate: "tymTemperate",
  polar: "tymPolar",
  arctic: "tymArctic",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "tymAuditSave",
  edit: "tymAuditEdit",
  note: "tymAuditNote",
  finish: "tymAuditFinish",
  set: "tymAuditSet",
  clear: "tymAuditClear",
  sheath: "tymAuditSheath",
  resume: "tymAuditResume",
  crypt: "tymAuditCrypt",
  open: "tymAuditOpen",
  tag: "tymAuditTag",
  pin: "tymAuditPin",
  span: "tymAuditSpan",
  lower: "tymAuditLower",
  star: "tymAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  house: "umbHouse",
  fort: "umbFort",
  harbor: "umbHarbor",
  digit: "umbDigit",
  spark: "umbSpark",
  scroll: "umbScroll",
  vowel: "umbVowel",
  post: "umbPost",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "umbChampagne",
  ivory: "umbIvory",
  graphite: "umbGraphite",
};

const SHAPE_KEY: Record<UmbraShape, CrmV4CopyKey> = {
  all: "umbShapeAll",
  house: "umbShapeHouse",
  fort: "umbShapeFort",
  harbor: "umbShapeHarbor",
  digit: "umbShapeDigit",
  spark: "umbShapeSpark",
  scroll: "umbShapeScroll",
  vowel: "umbShapeVowel",
  post: "umbShapePost",
  open: "umbShapeOpen",
  soon: "umbShapeSoon",
  letter: "umbShapeLetter",
  mixed: "umbShapeMixed",
  upper: "umbShapeUpper",
  lower: "umbShapeLower",
  space: "umbShapeSpace",
  even: "umbShapeEven",
  odd: "umbShapeOdd",
  tail: "umbShapeTail",
  first: "umbShapeFirst",
  held: "umbShapeHeld",
  hyphen: "umbShapeHyphen",
  period: "umbShapePeriod",
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

function quarterLabel(v4: V4, quarter: string): string {
  const key = CLIMATE_KEY[quarter];
  return key ? v4(key) : v4("tymBlankClimate");
}

function finishLabel(v4: V4, finish: string): string {
  if (finish === "BRASS") return v4("tymBrass");
  if (finish === "SILVER") return v4("tymSilver");
  if (finish === "ENAMEL") return v4("tymEnamel");
  return v4("tymAll");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("umbUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("umbUnmarked");
}

export function TympanRules({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Tympan[]>([]);
  const [views, setViews] = useState<TympanView[]>([]);
  const [density, setDensity] = useState<TympanDensity>("broad");
  const [tray, setTray] = useState<TympanTray>("face");
  const [query, setQuery] = useState("");
  const [sighterFilter, setSighterFilter] = useState("");
  const [finishFilter, setFinishFilter] = useState("all");
  const [quarterFilter, setQuarterFilter] = useState("all");
  const [spanFilter, setSpanFilter] = useState("all");
  const [pinFilter, setPinFilter] = useState("all");
  const [sort, setSort] = useState<TympanSort>("quarter");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [sighter, setSighter] = useState("");
  const [quarter, setQuarter] = useState("");
  const [finish, setFinish] = useState("");
  const [spanNo, setSpanNo] = useState("");
  const [pinNo, setPinNo] = useState("");
  const [tags, setTags] = useState("");
  const [viewName, setViewName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focusAt, setFocusAt] = useState(0);
  const [desk, setDesk] = useState("tropic");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readTympanRules(readJson(TYM_KEY, [])));
    setViews(readTympanViews(readJson(TYM_VIEW_KEY, [])));
    setDensity(tympanDensity(readJson(TYM_DENSITY_KEY, "broad")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Tympan[]) {
    setCards(next);
    writeJson(TYM_KEY, next);
  }
  function storeViews(next: TympanView[]) {
    setViews(next);
    writeJson(TYM_VIEW_KEY, next);
  }
  function storeDensity(next: TympanDensity) {
    setDensity(next);
    writeJson(TYM_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortTympanRules(visibleTympanRules(cards, tray, query, sighterFilter, finishFilter, quarterFilter, spanFilter, pinFilter), sort),
    [cards, tray, query, sighterFilter, finishFilter, quarterFilter, spanFilter, pinFilter, sort],
  );
  const counts = tympanCounts(cards, shown, desk);
  const bars = tympanBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = tympanTimeline(cards);
  const sighters = tympanSighters(cards);
  const suggested = suggestFinish(cards);
  const fair = fairSighter(cards, sighters.join(","));
  const busy = busiestSighter(cards);
  const reminders = reminderTympanRules(cards);
  const spanHint = suggestSpan(cards, clock);
  const quarterHint = suggestQuarter(clock);
  const focused = shown[focusAt];

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setTitle("");
        setNote("");
        setSighter("");
        setQuarter("");
        setFinish("");
        setSpanNo("");
        setPinNo("");
        setTags("");
        return;
      }
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocusAt((index) => moveTympanFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocusAt((index) => moveTympanFocus(index, shown.length, -1));
        return;
      }
      if (viewer) return;
      const id = shown[focusAt]?.id || "";
      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        store(liftSpanFocused(cards, id));
        return;
      }
      if (event.key === "v" || event.key === "V") {
        event.preventDefault();
        store(setTympanVault(cards, id, !shown[focusAt]?.held));
        return;
      }
      if (event.key === "m" || event.key === "M") {
        event.preventDefault();
        store(finishFocused(cards, id));
        return;
      }
      if (event.key === "c" || event.key === "C") {
        event.preventDefault();
        store(sleeveTympanFocused(cards, id));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        store(setTympanFocused(cards, id));
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("tympan-rules.csv", tympanCsv(shown, desk));
        return;
      }
      if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        store(starTympanFocused(cards, id));
        return;
      }
      if (event.key === "u" || event.key === "U") {
        event.preventDefault();
        store(raisePinFocused(cards, id));
        return;
      }
      if (event.key === "d" || event.key === "D") {
        event.preventDefault();
        store(lowerPinFocused(cards, id));
        return;
      }
      if (event.key === "o" || event.key === "O") {
        event.preventDefault();
        store(lowerSpanFocused(cards, id));
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
    <section className="c4-tympan" aria-label={v4("tymTitle")} data-cards="1" data-desk={tray} data-names="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-tympan-mast">
        <p className="c4-tympan-seal" data-logo="mono">{v4("tymLogo")}</p>
        <div>
          <p className="c4-tympan-kicker">{v4("tymSub")}</p>
          <h2 className="c4-title">{v4("tymTitle")}</h2>
        </div>
        <p className="c4-tympan-count">{counts.matched}</p>
      </header>
      <ol className="c4-tympan-index" aria-label={v4("tymTitle")}>
        <li data-tone="gold">{v4("tymFace")} {counts.court}</li>
        <li data-tone="ink">{v4("tymOverdue")} {counts.overdue}</li>
        <li data-tone="ivory">{v4("tymHouse")} {counts.house}</li>
      </ol>
      <p className="c4-tympan-links">
        <Link href={crmv4Href(base, "umb")}>{v4("umbTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("tymCustomers")}</Link>
      </p>
      <p className="c4-tympan-hint">{v4("tymHint")}</p>
      {viewer && <p className="c4-tympan-note">{v4("tymViewer")}</p>}
      {counts.overdue > 0 && <p className="c4-tympan-notice" role="status">{v4("tymOverdue")} {counts.overdue}</p>}
      <ol className="c4-tympan-dials" aria-label={v4("tymChart")}>
        <li>{v4("tymFace")} {counts.court}</li>
        <li>{v4("tymSleeve")} {counts.sleeve}</li>
        <li>{v4("tymCoffer")} {counts.vault}</li>
        <li>{v4("tymInner")} {counts.inner}</li>
        <li>{v4("tymOuter")} {counts.outer}</li>
        <li>{v4("tymWide")} {counts.wide}</li>
        <li>{v4("tymStar")} {counts.starred}</li>
        <li>{v4("tymIdle")} {counts.idle}</li>
        <li>{v4("tymBrisk")} {counts.brisk}</li>
        <li>{v4("tymResting")} {counts.resting}</li>
      </ol>
      <div className="c4-tympan-chart" aria-label={v4("tymChart")}>
        {bars.map((bar) => (
          <button key={bar.quarter} type="button" className="c4-tympan-column" data-on={quarterFilter === bar.quarter ? "1" : "0"} data-quarter={bar.quarter} onClick={() => setQuarterFilter(quarterFilter === bar.quarter ? "all" : bar.quarter)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{quarterLabel(v4, bar.quarter)}</span>
          </button>
        ))}
      </div>
      <div className="c4-tympan-tools">
        <input ref={searchRef} className="c4-field c4-tympan-search" aria-label={v4("tymSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("tymSearch")} />
        {(["face", "sleeve", "coffer"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "face" ? "tymFace" : item === "sleeve" ? "tymSleeve" : "tymCoffer")}</button>
        ))}
        {(["all", "inner", "outer", ...TYM_QUARTERS] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={quarterFilter === item ? "1" : "0"} onClick={() => setQuarterFilter(item)}>{item === "all" ? v4("tymAll") : item === "inner" ? v4("tymInner") : item === "outer" ? v4("tymOuter") : quarterLabel(v4, item)}</button>
        ))}
        {(["all", ...FINISHES] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={finishFilter === item ? "1" : "0"} onClick={() => setFinishFilter(item)}>{item === "all" ? v4("tymAll") : finishLabel(v4, item)}</button>
        ))}
        {(["all", ...SPANS] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={spanFilter === item ? "1" : "0"} onClick={() => setSpanFilter(item)}>{item === "all" ? v4("tymAltitude") : item}</button>
        ))}
        {(["all", ...PINS] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={pinFilter === item ? "1" : "0"} onClick={() => setPinFilter(item)}>{item === "all" ? v4("tymPeg") : item}</button>
        ))}
        <button type="button" className="c4-chip" data-on={sort === "quarter" ? "1" : "0"} onClick={() => setSort("quarter")}>{v4("tymSortClimate")}</button>
        <button type="button" className="c4-chip" data-on={sort === "sighter" ? "1" : "0"} onClick={() => setSort("sighter")}>{v4("tymSortEngraver")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "broad" : "tight")}>{density === "tight" ? v4("tymTight") : v4("tymBroad")}</button>
        {TYM_QUARTERS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={desk === item ? "1" : "0"} onClick={() => setDesk(item)}>{v4("tymDesk")} {quarterLabel(v4, item)}</button>
        ))}
        {sighters.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={sighterFilter === name ? "1" : "0"} onClick={() => setSighterFilter(sighterFilter === name ? "" : name)}>{name}</button>
        ))}
      </div>
      <p className="c4-tympan-meta">{v4("tymSuggest")} {finishLabel(v4, suggested)} · {spanHint} · {quarterLabel(v4, quarterHint)} · {v4("tymFair")} {fair || "—"} · {v4("tymBusy")} {busy || "—"}</p>
      {reminders.length > 0 && (
        <ul className="c4-tympan-remind" aria-label={v4("tymRemind")}>
          {reminders.map((item) => <li key={item}>{item}</li>)}
        </ul>
      )}
      {timeline.length > 0 && (
        <ol className="c4-tympan-time" aria-label={v4("tymTimeline")}>
          {timeline.map((lane) => <li key={lane.span}>{lane.span} · {lane.titles.join(" · ")}</li>)}
        </ol>
      )}
      <form className="c4-tympan-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addTympan(cards, { title, note, sighter, quarter, finish, span: spanNo, pin: pinNo, tags });
        if (next.length === cards.length) return;
        store(next);
        setTitle("");
        setNote("");
        setTags("");
      }}>
        <input className="c4-field" aria-label={v4("tymEdit")} aria-required={false} value={title} onChange={(event) => setTitle(event.target.value)} placeholder={v4("tymEdit")} disabled={viewer} />
        <input className="c4-field" aria-label={v4("tymNote")} aria-required={false} value={note} onChange={(event) => setNote(event.target.value)} placeholder={v4("tymNote")} disabled={viewer} />
        <input className="c4-field" aria-label={v4("tymEngraver")} aria-required={false} value={sighter} onChange={(event) => setSighter(event.target.value)} placeholder={v4("tymEngraver")} disabled={viewer} />
        <select className="c4-select" aria-label={v4("tymDesk")} value={quarter} onChange={(event) => setQuarter(event.target.value)} disabled={viewer}>
          <option value="">{v4("tymBlankClimate")}</option>
          {TYM_QUARTERS.map((item) => <option key={item} value={item}>{quarterLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("tymMetal")} value={finish} onChange={(event) => setFinish(event.target.value)} disabled={viewer}>
          <option value="">{v4("tymMetal")}</option>
          {FINISHES.map((item) => <option key={item} value={item}>{finishLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("tymAltitude")} value={spanNo} onChange={(event) => setSpanNo(event.target.value)} disabled={viewer}>
          <option value="">{v4("tymAltitude")}</option>
          {SPANS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("tymPeg")} value={pinNo} onChange={(event) => setPinNo(event.target.value)} disabled={viewer}>
          <option value="">{v4("tymPeg")}</option>
          {PINS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <input className="c4-field" aria-label={v4("tymTag")} aria-required={false} value={tags} onChange={(event) => setTags(event.target.value)} placeholder={v4("tymTag")} disabled={viewer} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("tymAdd")}</button>
      </form>
      <form className="c4-tympan-views" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addTympanView(views, { id: `v${Date.now().toString(36)}`, name: viewName, tray, query, sighter: sighterFilter, finish: finishFilter, quarter: quarterFilter, span: spanFilter, pin: pinFilter });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <input className="c4-field" aria-label={v4("tymViewName")} aria-required={false} value={viewName} onChange={(event) => setViewName(event.target.value)} placeholder={v4("tymViewName")} disabled={viewer} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("tymSaveView")}</button>
        {views.map((view) => (
          <span key={view.id} className="c4-tympan-view">
            <button type="button" className="c4-chip" onClick={() => { setTray(view.tray); setQuery(view.query); setSighterFilter(view.sighter); setFinishFilter(view.finish); setQuarterFilter(view.quarter); setSpanFilter(view.span); setPinFilter(view.pin); }}>{v4("tymApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropTympanView(views, view.id))}>{v4("tymDrop")}</button>
          </span>
        ))}
      </form>
      <div className="c4-tympan-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkTympanSighted(cards, picked))}>{v4("tymBulkLaid")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkTympanEnamel(cards, picked))}>{v4("tymBulkEnamel")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkTympanVault(cards, picked))}>{v4("tymBulkCrypt")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkTympanTag(cards, picked))}>{v4("tymBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("tympan-rules.csv", tympanCsv(shown, desk))}>{v4("tymCsv")}</button>
      </div>
      <p className="c4-tympan-keys">{v4("tymKeys")} j k / p o u d m c a s v x</p>
      {!shown.length && <p className="c4-pay-empty">{v4("tymEmpty")}</p>}
      <ul className="c4-tympan-list" data-density={density}>
        {shown.map((card) => {
          const auditKey = AUDIT_KEY[card.audit];
          return (
            <li key={card.id} className="c4-tympan-card" data-on={focused?.id === card.id ? "1" : "0"} data-quarter={card.quarter || "blank"} data-late={lateTympan(card, desk) ? "1" : "0"} data-idle={idleTympan(card) ? "1" : "0"} data-brisk={briskTympan(card) ? "1" : "0"} data-resting={restingTympan(card) ? "1" : "0"} data-overdue={overdueTympan(card) ? "1" : "0"} data-inner={tympanInner(card.quarter) ? "1" : "0"} data-outer={tympanOuter(card.quarter) ? "1" : "0"}>
              <label className="c4-tympan-pick">
                <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
              </label>
              <div>
                <input className="c4-field" aria-label={v4("tymEdit")} aria-required={false} defaultValue={card.title} disabled={viewer} onBlur={(event) => store(editTympan(cards, card.id, event.target.value))} />
                <input className="c4-field" aria-label={v4("tymNote")} aria-required={false} defaultValue={card.note} disabled={viewer} onBlur={(event) => store(editTympanNote(cards, card.id, event.target.value))} />
                <p className="c4-tympan-meta">{card.sighter || "—"} · {quarterLabel(v4, card.quarter)} · {finishLabel(v4, card.finish)} · {card.span ?? "—"} · {card.pin} · {card.tags.join(" ") || "—"}</p>
                {auditKey && <p className="c4-tympan-audit">{v4(auditKey)}</p>}
              </div>
              <div className="c4-tympan-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTympanSighted(cards, card.id, !card.laid))}>{card.laid ? v4("tymClear") : v4("tymLay")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTympanCloth(cards, card.id, suggested))}>{v4("tymSuggest")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTympanSleeve(cards, card.id, !card.locked))}>{card.locked ? v4("tymUnsleeve") : v4("tymSheathIt")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTympanVault(cards, card.id, !card.held))}>{card.held ? v4("tymUnvault") : v4("tymCryptIt")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTympanStar(cards, card.id, !card.starred))}>{card.starred ? v4("tymUnstar") : v4("tymStar")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addTympanTag(cards, card.id, "t"))}>{v4("tymTag")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(liftSpanFocused(cards, card.id))}>{v4("tymLift")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerSpanFocused(cards, card.id))}>{v4("tymLower")}</button>
                <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(tympanCopy(card))}>{v4("tymCopy")}</button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

type UmbraUser = { id?: string; name?: string | null; documentsStatus?: boolean | string | number | null };

export function UmbraPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: UmbraUser[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<UmbraShape>("all");
  const [review, setReview] = useState<UmbraReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): UmbraRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      umbra: { documentsStatus: textField(row.documentsStatus) } satisfies UmbraValue,
    };
  }).filter((row): row is UmbraRow => Boolean(row));
  const present = presentUmbraLanes(rows);
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
    const next = readHiddenUmbras(readJson(UMB_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(UMB_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedUmbras(readJson(UMB_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(UMB_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleUmbraLanes(present, hidden, showHidden);
  const shown = visibleUmbras(rows, lanes.includes(lane) || lane === "all" ? lane : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = umbraLane(row.umbra);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = umbraLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingUmbra(rows);
  const leadHue = leadingUmbraHue(rows);
  const whole = rows.filter((row) => umbraLane(row.umbra)).length;
  const share = umbraShare(laneUmbraCount(rows, "house"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("umbra-lanes.csv", umbraLanesCsv(rows));
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
    writeJson(UMB_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(UMB_REVIEW_KEY, next);
  }

  return (
    <section className="c4-umbra" aria-label={v4("umbTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-umbra-mast">
        <p className="c4-umbra-seal" data-logo="mono">{v4("umbLogo")}</p>
        <div>
          <p className="c4-umbra-kicker">{v4("umbSub")}</p>
          <h2 className="c4-title">{v4("umbTitle")}</h2>
        </div>
        <p className="c4-umbra-count">{shown.length}</p>
      </header>
      <p className="c4-umbra-links">
        <Link href={crmv4Href(base, "tym")}>{v4("tymTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("umbCustomer")}</Link>
      </p>
      <p className="c4-umbra-hint">{v4("umbHint")}</p>
      {viewer && <p className="c4-umbra-note">{v4("umbViewer")}</p>}
      <p className="c4-umbra-meta">{v4("umbLead")} {laneLabel(v4, lead)} · {v4("umbToneLead")} {hueLabel(v4, leadHue)} · {v4("umbShare")} {share}</p>
      <div className="c4-umbra-chart" aria-label={v4("umbChart")}>
        {lines.map((line) => (
          <button key={line.lane} type="button" className="c4-umbra-column" data-on={lane === line.lane ? "1" : "0"} data-lane={line.lane} onClick={() => setLane(lane === line.lane ? "all" : line.lane)}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-umbra-tools">
        <input ref={searchRef} className="c4-field c4-umbra-search" aria-label={v4("umbSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("umbSearch")} />
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("umbShow")}</button>
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{v4(item === "all" ? "umbAll" : item === "reviewed" ? "umbReviewed" : "umbFresh")}</button>
        ))}
        {(["all", "champagne", "ivory", "graphite"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("umbAll") : hueLabel(v4, item)}</button>
        ))}
        {(Object.keys(SHAPE_KEY) as UmbraShape[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" onClick={() => storeHidden(toggleUmbra(hidden, item))}>{hidden.includes(item) ? v4("umbShow") : v4("umbHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-umbra-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkUmbraReview(reviewed, picked, true))}>{v4("umbBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkUmbraReview(reviewed, picked, false))}>{v4("umbBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("umbra-lanes.csv", umbraLanesCsv(rows))}>{v4("umbCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("umbra-rows.csv", umbraRowsCsv(shown, reviewed))}>{v4("umbRowCsv")}</button>
      </div>
      {queue.loading && !rows.length && <p className="c4-meta">{v4("umbLoading")}</p>}
      {queue.error && <p className="c4-meta">{v4("umbFailed")}</p>}
      {!queue.loading && !queue.error && !rows.length && <p className="c4-pay-empty">{v4("umbEmpty")}</p>}
      <ul className="c4-umbra-list">
        {shown.map((row) => {
          const name = umbraCopy(row.umbra);
          const tone = umbraHue(row.umbra);
          return (
            <li key={row.id} className="c4-umbra-card" data-lane={umbraLane(row.umbra) || "open"} data-hue={tone || "none"} data-house={umbraHouseSafe(row.umbra)} data-open={umbraOpen(row.umbra) ? "1" : "0"} data-even={umbraEven(row.umbra) ? "1" : "0"} data-digit={umbraDigit(row.umbra) ? "1" : "0"} data-letter={umbraLetter(row.umbra) ? "1" : "0"} data-mixed={umbraMixed(row.umbra) ? "1" : "0"} data-upper={umbraUpper(row.umbra) ? "1" : "0"} data-lower={umbraLower(row.umbra) ? "1" : "0"} data-space={umbraSpace(row.umbra) ? "1" : "0"} data-vowel={umbraVowel(row.umbra) ? "1" : "0"} data-tail={umbraTail(row.umbra) ? "1" : "0"} data-first={umbraFirst(row.umbra) ? "1" : "0"} data-held={umbraHeld(row.umbra) ? "1" : "0"} data-hyphen={umbraHyphen(row.umbra) ? "1" : "0"} data-period={umbraPeriod(row.umbra) ? "1" : "0"} data-capital={umbraCapital(row.umbra) ? "1" : "0"}>
              <label className="c4-umbra-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-umbra-meta">{name || v4("umbOpen")} · {umbraStamp(row.umbra) || "—"} · {umbraFamily(row.umbra) || "—"} · {umbraLength(row.umbra) ?? "—"} · {laneLabel(v4, umbraLane(row.umbra))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-umbra-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleUmbraReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("umbReviewed") : v4("umbReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const text = umbraCopy(row.umbra); if (!text) return; navigator.clipboard?.writeText(text); setCopied(row.id); }}>{copied === row.id ? v4("umbCopied") : v4("umbCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("umbCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function umbraHouseSafe(raw: UmbraValue): string {
  return umbraLane(raw) === "house" ? "1" : "0";
}
