"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  GLY_KEY,
  GLY_REVIEW_KEY,
  ALM_STAVES,
  ALM_DENSITY_KEY,
  ALM_KEY,
  ALM_VIEW_KEY,
  addAnalemmaTag,
  addAnalemmaView,
  addAnalemma,
  briskAnalemma,
  bulkGlyphReview,
  bulkAnalemmaVault,
  bulkAnalemmaSighted,
  bulkAnalemmaTag,
  bulkAnalemmaOak,
  busiestBearer,
  dropAnalemmaView,
  editAnalemmaNote,
  editAnalemma,
  fairBearer,
  glyphCapital,
  glyphCopy,
  glyphDigit,
  glyphEven,
  glyphFamily,
  glyphFirst,
  glyphHeld,
  glyphHue,
  glyphHyphen,
  glyphLane,
  glyphLanes,
  glyphLanesCsv,
  glyphLength,
  glyphLetter,
  glyphLower,
  glyphMixed,
  glyphOpen,
  glyphPeriod,
  glyphRowsCsv,
  glyphShare,
  glyphSpace,
  glyphStamp,
  glyphTail,
  glyphUpper,
  glyphVowel,
  idleAnalemma,
  laneGlyphCount,
  lateAnalemma,
  leadingGlyph,
  leadingGlyphHue,
  liftNotchFocused,
  lowerVaneFocused,
  lowerNotchFocused,
  moveAnalemmaFocus,
  analemmaBars,
  analemmaCopy,
  analemmaCounts,
  analemmaCsv,
  analemmaDensity,
  analemmaInner,
  analemmaOuter,
  analemmaBearers,
  analemmaTimeline,
  overdueAnalemma,
  presentGlyphLanes,
  raiseVaneFocused,
  readHiddenGlyphs,
  readAnalemmaViews,
  readAnalemmaRules,
  readReviewedGlyphs,
  reminderAnalemmaRules,
  restingAnalemma,
  setAnalemmaFocused,
  setAnalemmaVault,
  setAnalemmaSighted,
  setAnalemmaRack,
  setAnalemmaStar,
  setAnalemmaWood,
  sortAnalemmaRules,
  starAnalemmaFocused,
  suggestNotch,
  suggestStaff,
  suggestWood,
  toggleGlyph,
  toggleGlyphReview,
  visibleGlyphLanes,
  visibleGlyphs,
  visibleAnalemmaRules,
  woodFocused,
  rackAnalemmaFocused,
  type GlyphReview,
  type GlyphRow,
  type GlyphShape,
  type GlyphValue,
  type AnalemmaDensity,
  type AnalemmaSort,
  type AnalemmaTray,
  type AnalemmaView,
  type Analemma,
} from "@/lib/crmv4/round315";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const WOODS = ["GILT", "IVORY", "SLATE"] as const;
const NOTCHES = ["5", "10", "20", "40"] as const;
const VANES = ["1", "3", "9"] as const;

const CLIMATE_KEY: Record<string, CrmV4CopyKey> = {
  rise: "almReed",
  noon: "almWand",
  dusk: "almPole",
  night: "almMast",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "almAuditSave",
  edit: "almAuditEdit",
  note: "almAuditNote",
  wood: "almAuditWood",
  set: "almAuditSet",
  clear: "almAuditClear",
  sheath: "almAuditRack",
  resume: "almAuditResume",
  crypt: "almAuditCase",
  open: "almAuditOpen",
  tag: "almAuditTag",
  vane: "almAuditVane",
  notch: "almAuditNotch",
  lower: "almAuditLowerNotch",
  star: "almAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  house: "glyHouse",
  fort: "glyFort",
  harbor: "glyHarbor",
  digit: "glyDigit",
  spark: "glySpark",
  scroll: "glyScroll",
  vowel: "glyVowel",
  post: "glyPost",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "glyChampagne",
  ivory: "glyIvory",
  graphite: "glyGraphite",
};

const SHAPE_KEY: Record<GlyphShape, CrmV4CopyKey> = {
  all: "glyShapeAll",
  house: "glyShapeHouse",
  fort: "glyShapeFort",
  harbor: "glyShapeHarbor",
  digit: "glyShapeDigit",
  spark: "glyShapeSpark",
  scroll: "glyShapeScroll",
  vowel: "glyShapeVowel",
  post: "glyShapePost",
  open: "glyShapeOpen",
  soon: "glyShapeSoon",
  letter: "glyShapeLetter",
  mixed: "glyShapeMixed",
  upper: "glyShapeUpper",
  lower: "glyShapeLower",
  space: "glyShapeSpace",
  even: "glyShapeEven",
  odd: "glyShapeOdd",
  tail: "glyShapeTail",
  first: "glyShapeFirst",
  cased: "glyShapeHeld",
  hyphen: "glyShapeHyphen",
  period: "glyShapePeriod",
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

function staffLabel(v4: V4, staff: string): string {
  const key = CLIMATE_KEY[staff];
  return key ? v4(key) : v4("almBlankBoard");
}

function woodLabel(v4: V4, wood: string): string {
  if (wood === "GILT") return v4("almLime");
  if (wood === "IVORY") return v4("almYew");
  if (wood === "SLATE") return v4("almOak");
  return v4("almAll");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("glyUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("glyUnmarked");
}

export function AnalemmaRules({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Analemma[]>([]);
  const [views, setViews] = useState<AnalemmaView[]>([]);
  const [density, setDensity] = useState<AnalemmaDensity>("broad");
  const [tray, setTray] = useState<AnalemmaTray>("yard");
  const [query, setQuery] = useState("");
  const [bearerFilter, setBearerFilter] = useState("");
  const [woodFilter, setWoodFilter] = useState("all");
  const [staffFilter, setStaffFilter] = useState("all");
  const [notchFilter, setNotchFilter] = useState("all");
  const [vaneFilter, setVaneFilter] = useState("all");
  const [sort, setSort] = useState<AnalemmaSort>("staff");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [bearer, setBearer] = useState("");
  const [staff, setStaff] = useState("");
  const [wood, setWood] = useState("");
  const [notchNo, setNotchNo] = useState("");
  const [vaneNo, setVaneNo] = useState("");
  const [tags, setTags] = useState("");
  const [viewName, setViewName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focusAt, setFocusAt] = useState(0);
  const [desk, setDesk] = useState("rise");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readAnalemmaRules(readJson(ALM_KEY, [])));
    setViews(readAnalemmaViews(readJson(ALM_VIEW_KEY, [])));
    setDensity(analemmaDensity(readJson(ALM_DENSITY_KEY, "broad")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Analemma[]) {
    setCards(next);
    writeJson(ALM_KEY, next);
  }
  function storeViews(next: AnalemmaView[]) {
    setViews(next);
    writeJson(ALM_VIEW_KEY, next);
  }
  function storeDensity(next: AnalemmaDensity) {
    setDensity(next);
    writeJson(ALM_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortAnalemmaRules(visibleAnalemmaRules(cards, tray, query, bearerFilter, woodFilter, staffFilter, notchFilter, vaneFilter), sort),
    [cards, tray, query, bearerFilter, woodFilter, staffFilter, notchFilter, vaneFilter, sort],
  );
  const counts = analemmaCounts(cards, shown, desk);
  const bars = analemmaBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = analemmaTimeline(cards);
  const bearers = analemmaBearers(cards);
  const suggested = suggestWood(cards);
  const fair = fairBearer(cards, bearers.join(","));
  const busy = busiestBearer(cards);
  const reminders = reminderAnalemmaRules(cards);
  const notchHint = suggestNotch(cards, clock);
  const staffHint = suggestStaff(clock);
  const focused = shown[focusAt];

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setTitle("");
        setNote("");
        setBearer("");
        setStaff("");
        setWood("");
        setNotchNo("");
        setVaneNo("");
        setTags("");
        return;
      }
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocusAt((index) => moveAnalemmaFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocusAt((index) => moveAnalemmaFocus(index, shown.length, -1));
        return;
      }
      if (viewer) return;
      const id = shown[focusAt]?.id || "";
      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        store(liftNotchFocused(cards, id));
        return;
      }
      if (event.key === "v" || event.key === "V") {
        event.preventDefault();
        store(setAnalemmaVault(cards, id, !shown[focusAt]?.cased));
        return;
      }
      if (event.key === "m" || event.key === "M") {
        event.preventDefault();
        store(woodFocused(cards, id));
        return;
      }
      if (event.key === "c" || event.key === "C") {
        event.preventDefault();
        store(rackAnalemmaFocused(cards, id));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        store(setAnalemmaFocused(cards, id));
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("analemma-rules.csv", analemmaCsv(shown, desk));
        return;
      }
      if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        store(starAnalemmaFocused(cards, id));
        return;
      }
      if (event.key === "u" || event.key === "U") {
        event.preventDefault();
        store(raiseVaneFocused(cards, id));
        return;
      }
      if (event.key === "d" || event.key === "D") {
        event.preventDefault();
        store(lowerVaneFocused(cards, id));
        return;
      }
      if (event.key === "o" || event.key === "O") {
        event.preventDefault();
        store(lowerNotchFocused(cards, id));
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
    <section className="c4-analemma" aria-label={v4("almTitle")} data-cards="1" data-desk={tray} data-names="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-analemma-mast">
        <p className="c4-analemma-seal" data-logo="mono">{v4("almLogo")}</p>
        <div>
          <p className="c4-analemma-kicker">{v4("almSub")}</p>
          <h2 className="c4-title">{v4("almTitle")}</h2>
        </div>
        <p className="c4-analemma-count">{counts.matched}</p>
      </header>
      <ol className="c4-analemma-index" aria-label={v4("almTitle")}>
        <li data-tone="gold">{v4("almBoard")} {counts.court}</li>
        <li data-tone="ink">{v4("almOverdue")} {counts.overdue}</li>
        <li data-tone="ivory">{v4("almHouse")} {counts.house}</li>
      </ol>
      <p className="c4-analemma-links">
        <Link href={crmv4Href(base, "gly")}>{v4("glyTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("almCustomers")}</Link>
      </p>
      <p className="c4-analemma-hint">{v4("almHint")}</p>
      {viewer && <p className="c4-analemma-note">{v4("almViewer")}</p>}
      {counts.overdue > 0 && <p className="c4-analemma-notice" role="status">{v4("almOverdue")} {counts.overdue}</p>}
      <ol className="c4-analemma-dials" aria-label={v4("almChart")}>
        <li>{v4("almBoard")} {counts.court}</li>
        <li>{v4("almRack")} {counts.rack}</li>
        <li>{v4("almCase")} {counts.vault}</li>
        <li>{v4("almInner")} {counts.inner}</li>
        <li>{v4("almOuter")} {counts.outer}</li>
        <li>{v4("almWide")} {counts.wide}</li>
        <li>{v4("almStar")} {counts.starred}</li>
        <li>{v4("almIdle")} {counts.idle}</li>
        <li>{v4("almBrisk")} {counts.brisk}</li>
        <li>{v4("almResting")} {counts.resting}</li>
      </ol>
      <div className="c4-analemma-chart" aria-label={v4("almChart")}>
        {bars.map((bar) => (
          <button key={bar.staff} type="button" className="c4-analemma-column" data-on={staffFilter === bar.staff ? "1" : "0"} data-staff={bar.staff} onClick={() => setStaffFilter(staffFilter === bar.staff ? "all" : bar.staff)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{staffLabel(v4, bar.staff)}</span>
          </button>
        ))}
      </div>
      <div className="c4-analemma-tools">
        <input ref={searchRef} className="c4-field c4-analemma-search" aria-label={v4("almSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("almSearch")} />
        {(["yard", "rack", "case"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "yard" ? "almBoard" : item === "rack" ? "almRack" : "almCase")}</button>
        ))}
        {(["all", "inner", "outer", ...ALM_STAVES] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={staffFilter === item ? "1" : "0"} onClick={() => setStaffFilter(item)}>{item === "all" ? v4("almAll") : item === "inner" ? v4("almInner") : item === "outer" ? v4("almOuter") : staffLabel(v4, item)}</button>
        ))}
        {(["all", ...WOODS] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={woodFilter === item ? "1" : "0"} onClick={() => setWoodFilter(item)}>{item === "all" ? v4("almAll") : woodLabel(v4, item)}</button>
        ))}
        {(["all", ...NOTCHES] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={notchFilter === item ? "1" : "0"} onClick={() => setNotchFilter(item)}>{item === "all" ? v4("almNotch") : item}</button>
        ))}
        {(["all", ...VANES] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={vaneFilter === item ? "1" : "0"} onClick={() => setVaneFilter(item)}>{item === "all" ? v4("almVane") : item}</button>
        ))}
        <button type="button" className="c4-chip" data-on={sort === "staff" ? "1" : "0"} onClick={() => setSort("staff")}>{v4("almSortBoard")}</button>
        <button type="button" className="c4-chip" data-on={sort === "bearer" ? "1" : "0"} onClick={() => setSort("bearer")}>{v4("almSortBearer")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "broad" : "tight")}>{density === "tight" ? v4("almTight") : v4("almBroad")}</button>
        {ALM_STAVES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={desk === item ? "1" : "0"} onClick={() => setDesk(item)}>{v4("almDesk")} {staffLabel(v4, item)}</button>
        ))}
        {bearers.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={bearerFilter === name ? "1" : "0"} onClick={() => setBearerFilter(bearerFilter === name ? "" : name)}>{name}</button>
        ))}
      </div>
      <p className="c4-analemma-meta">{v4("almSuggest")} {woodLabel(v4, suggested)} · {notchHint} · {staffLabel(v4, staffHint)} · {v4("almFair")} {fair || "—"} · {v4("almBusy")} {busy || "—"}</p>
      {reminders.length > 0 && (
        <ul className="c4-analemma-remind" aria-label={v4("almRemind")}>
          {reminders.map((item) => <li key={item}>{item}</li>)}
        </ul>
      )}
      {timeline.length > 0 && (
        <ol className="c4-analemma-time" aria-label={v4("almTimeline")}>
          {timeline.map((lane) => <li key={lane.notch}>{lane.notch} · {lane.titles.join(" · ")}</li>)}
        </ol>
      )}
      <form className="c4-analemma-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addAnalemma(cards, { title, note, bearer, staff, wood, notch: notchNo, vane: vaneNo, tags });
        if (next.length === cards.length) return;
        store(next);
        setTitle("");
        setNote("");
        setTags("");
      }}>
        <input className="c4-field" aria-label={v4("almEdit")} aria-required={false} value={title} onChange={(event) => setTitle(event.target.value)} placeholder={v4("almEdit")} disabled={viewer} />
        <input className="c4-field" aria-label={v4("almNote")} aria-required={false} value={note} onChange={(event) => setNote(event.target.value)} placeholder={v4("almNote")} disabled={viewer} />
        <input className="c4-field" aria-label={v4("almBearer")} aria-required={false} value={bearer} onChange={(event) => setBearer(event.target.value)} placeholder={v4("almBearer")} disabled={viewer} />
        <select className="c4-select" aria-label={v4("almDesk")} value={staff} onChange={(event) => setStaff(event.target.value)} disabled={viewer}>
          <option value="">{v4("almBlankBoard")}</option>
          {ALM_STAVES.map((item) => <option key={item} value={item}>{staffLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("almWood")} value={wood} onChange={(event) => setWood(event.target.value)} disabled={viewer}>
          <option value="">{v4("almWood")}</option>
          {WOODS.map((item) => <option key={item} value={item}>{woodLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("almNotch")} value={notchNo} onChange={(event) => setNotchNo(event.target.value)} disabled={viewer}>
          <option value="">{v4("almNotch")}</option>
          {NOTCHES.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("almVane")} value={vaneNo} onChange={(event) => setVaneNo(event.target.value)} disabled={viewer}>
          <option value="">{v4("almVane")}</option>
          {VANES.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <input className="c4-field" aria-label={v4("almTag")} aria-required={false} value={tags} onChange={(event) => setTags(event.target.value)} placeholder={v4("almTag")} disabled={viewer} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("almAdd")}</button>
      </form>
      <form className="c4-analemma-views" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addAnalemmaView(views, { id: `v${Date.now().toString(36)}`, name: viewName, tray, query, bearer: bearerFilter, wood: woodFilter, staff: staffFilter, notch: notchFilter, vane: vaneFilter });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <input className="c4-field" aria-label={v4("almViewName")} aria-required={false} value={viewName} onChange={(event) => setViewName(event.target.value)} placeholder={v4("almViewName")} disabled={viewer} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("almSaveView")}</button>
        {views.map((view) => (
          <span key={view.id} className="c4-analemma-view">
            <button type="button" className="c4-chip" onClick={() => { setTray(view.tray); setQuery(view.query); setBearerFilter(view.bearer); setWoodFilter(view.wood); setStaffFilter(view.staff); setNotchFilter(view.notch); setVaneFilter(view.vane); }}>{v4("almApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropAnalemmaView(views, view.id))}>{v4("almDrop")}</button>
          </span>
        ))}
      </form>
      <div className="c4-analemma-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkAnalemmaSighted(cards, picked))}>{v4("almBulkLaid")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkAnalemmaOak(cards, picked))}>{v4("almBulkOak")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkAnalemmaVault(cards, picked))}>{v4("almBulkCrypt")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkAnalemmaTag(cards, picked))}>{v4("almBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("analemma-rules.csv", analemmaCsv(shown, desk))}>{v4("almCsv")}</button>
      </div>
      <p className="c4-analemma-keys">{v4("almKeys")} j k / p o u d m c a s v x</p>
      {!shown.length && <p className="c4-pay-empty">{v4("almEmpty")}</p>}
      <ul className="c4-analemma-list" data-density={density}>
        {shown.map((card) => {
          const auditKey = AUDIT_KEY[card.audit];
          return (
            <li key={card.id} className="c4-analemma-card" data-on={focused?.id === card.id ? "1" : "0"} data-staff={card.staff || "blank"} data-late={lateAnalemma(card, desk) ? "1" : "0"} data-idle={idleAnalemma(card) ? "1" : "0"} data-brisk={briskAnalemma(card) ? "1" : "0"} data-resting={restingAnalemma(card) ? "1" : "0"} data-overdue={overdueAnalemma(card) ? "1" : "0"} data-inner={analemmaInner(card.staff) ? "1" : "0"} data-outer={analemmaOuter(card.staff) ? "1" : "0"}>
              <label className="c4-analemma-pick">
                <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
              </label>
              <div>
                <input className="c4-field" aria-label={v4("almEdit")} aria-required={false} defaultValue={card.title} disabled={viewer} onBlur={(event) => store(editAnalemma(cards, card.id, event.target.value))} />
                <input className="c4-field" aria-label={v4("almNote")} aria-required={false} defaultValue={card.note} disabled={viewer} onBlur={(event) => store(editAnalemmaNote(cards, card.id, event.target.value))} />
                <p className="c4-analemma-meta">{card.bearer || "—"} · {staffLabel(v4, card.staff)} · {woodLabel(v4, card.wood)} · {card.notch ?? "—"} · {card.vane} · {card.tags.join(" ") || "—"}</p>
                {auditKey && <p className="c4-analemma-audit">{v4(auditKey)}</p>}
              </div>
              <div className="c4-analemma-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setAnalemmaSighted(cards, card.id, !card.sighted))}>{card.sighted ? v4("almClear") : v4("almLay")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setAnalemmaWood(cards, card.id, suggested))}>{v4("almSuggest")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setAnalemmaRack(cards, card.id, !card.racked))}>{card.racked ? v4("almUnrack") : v4("almRackIt")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setAnalemmaVault(cards, card.id, !card.cased))}>{card.cased ? v4("almUncase") : v4("almCaseIt")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setAnalemmaStar(cards, card.id, !card.starred))}>{card.starred ? v4("almUnstar") : v4("almStar")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addAnalemmaTag(cards, card.id, "e"))}>{v4("almTag")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(liftNotchFocused(cards, card.id))}>{v4("almLift")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerNotchFocused(cards, card.id))}>{v4("almLower")}</button>
                <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(analemmaCopy(card))}>{v4("almCopy")}</button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

type GlyphUser = { id?: string; name?: string | null; saleStatus?: boolean | string | number | null };

export function GlyphPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: GlyphUser[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<GlyphShape>("all");
  const [review, setReview] = useState<GlyphReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): GlyphRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      glyph: { saleStatus: textField(row.saleStatus) } satisfies GlyphValue,
    };
  }).filter((row): row is GlyphRow => Boolean(row));
  const present = presentGlyphLanes(rows);
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
    const next = readHiddenGlyphs(readJson(GLY_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(GLY_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedGlyphs(readJson(GLY_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(GLY_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleGlyphLanes(present, hidden, showHidden);
  const shown = visibleGlyphs(rows, lanes.includes(lane) || lane === "all" ? lane : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = glyphLane(row.glyph);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = glyphLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingGlyph(rows);
  const leadHue = leadingGlyphHue(rows);
  const whole = rows.filter((row) => glyphLane(row.glyph)).length;
  const share = glyphShare(laneGlyphCount(rows, "house"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("glyph-lanes.csv", glyphLanesCsv(rows));
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
    writeJson(GLY_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(GLY_REVIEW_KEY, next);
  }

  return (
    <section className="c4-glyph" aria-label={v4("glyTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-glyph-mast">
        <p className="c4-glyph-seal" data-logo="mono">{v4("glyLogo")}</p>
        <div>
          <p className="c4-glyph-kicker">{v4("glySub")}</p>
          <h2 className="c4-title">{v4("glyTitle")}</h2>
        </div>
        <p className="c4-glyph-count">{shown.length}</p>
      </header>
      <p className="c4-glyph-links">
        <Link href={crmv4Href(base, "alm")}>{v4("almTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("glyCustomer")}</Link>
      </p>
      <p className="c4-glyph-hint">{v4("glyHint")}</p>
      {viewer && <p className="c4-glyph-note">{v4("glyViewer")}</p>}
      <p className="c4-glyph-meta">{v4("glyLead")} {laneLabel(v4, lead)} · {v4("glyToneLead")} {hueLabel(v4, leadHue)} · {v4("glyShare")} {share}</p>
      <div className="c4-glyph-chart" aria-label={v4("glyChart")}>
        {lines.map((line) => (
          <button key={line.lane} type="button" className="c4-glyph-column" data-on={lane === line.lane ? "1" : "0"} data-lane={line.lane} onClick={() => setLane(lane === line.lane ? "all" : line.lane)}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-glyph-tools">
        <input ref={searchRef} className="c4-field c4-glyph-search" aria-label={v4("glySearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("glySearch")} />
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("glyShow")}</button>
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{v4(item === "all" ? "glyAll" : item === "reviewed" ? "glyReviewed" : "glyFresh")}</button>
        ))}
        {(["all", "champagne", "ivory", "graphite"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("glyAll") : hueLabel(v4, item)}</button>
        ))}
        {(Object.keys(SHAPE_KEY) as GlyphShape[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" onClick={() => storeHidden(toggleGlyph(hidden, item))}>{hidden.includes(item) ? v4("glyShow") : v4("glyHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-glyph-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkGlyphReview(reviewed, picked, true))}>{v4("glyBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkGlyphReview(reviewed, picked, false))}>{v4("glyBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("glyph-lanes.csv", glyphLanesCsv(rows))}>{v4("glyCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("glyph-rows.csv", glyphRowsCsv(shown, reviewed))}>{v4("glyRowCsv")}</button>
      </div>
      {queue.loading && !rows.length && <p className="c4-meta">{v4("glyLoading")}</p>}
      {queue.error && <p className="c4-meta">{v4("glyFailed")}</p>}
      {!queue.loading && !queue.error && !rows.length && <p className="c4-pay-empty">{v4("glyEmpty")}</p>}
      <ul className="c4-glyph-list">
        {shown.map((row) => {
          const name = glyphCopy(row.glyph);
          const tone = glyphHue(row.glyph);
          return (
            <li key={row.id} className="c4-glyph-card" data-lane={glyphLane(row.glyph) || "open"} data-hue={tone || "none"} data-house={glyphHouseSafe(row.glyph)} data-open={glyphOpen(row.glyph) ? "1" : "0"} data-even={glyphEven(row.glyph) ? "1" : "0"} data-digit={glyphDigit(row.glyph) ? "1" : "0"} data-letter={glyphLetter(row.glyph) ? "1" : "0"} data-mixed={glyphMixed(row.glyph) ? "1" : "0"} data-upper={glyphUpper(row.glyph) ? "1" : "0"} data-lower={glyphLower(row.glyph) ? "1" : "0"} data-space={glyphSpace(row.glyph) ? "1" : "0"} data-vowel={glyphVowel(row.glyph) ? "1" : "0"} data-tail={glyphTail(row.glyph) ? "1" : "0"} data-first={glyphFirst(row.glyph) ? "1" : "0"} data-cased={glyphHeld(row.glyph) ? "1" : "0"} data-hyphen={glyphHyphen(row.glyph) ? "1" : "0"} data-period={glyphPeriod(row.glyph) ? "1" : "0"} data-capital={glyphCapital(row.glyph) ? "1" : "0"}>
              <label className="c4-glyph-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-glyph-meta">{name || v4("glyOpen")} · {glyphStamp(row.glyph) || "—"} · {glyphFamily(row.glyph) || "—"} · {glyphLength(row.glyph) ?? "—"} · {laneLabel(v4, glyphLane(row.glyph))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-glyph-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleGlyphReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("glyReviewed") : v4("glyReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const text = glyphCopy(row.glyph); if (!text) return; navigator.clipboard?.writeText(text); setCopied(row.id); }}>{copied === row.id ? v4("glyCopied") : v4("glyCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("glyCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function glyphHouseSafe(raw: GlyphValue): string {
  return glyphLane(raw) === "house" ? "1" : "0";
}
