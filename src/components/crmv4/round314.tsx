"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  RPL_KEY,
  RPL_REVIEW_KEY,
  CKD_STAVES,
  CKD_DENSITY_KEY,
  CKD_KEY,
  CKD_VIEW_KEY,
  addHorologiumTag,
  addHorologiumView,
  addHorologium,
  briskHorologium,
  bulkRippleReview,
  bulkHorologiumVault,
  bulkHorologiumSighted,
  bulkHorologiumTag,
  bulkHorologiumOak,
  busiestBearer,
  dropHorologiumView,
  editHorologiumNote,
  editHorologium,
  fairBearer,
  rippleCapital,
  rippleCopy,
  rippleDigit,
  rippleEven,
  rippleFamily,
  rippleFirst,
  rippleHeld,
  rippleHue,
  rippleHyphen,
  rippleLane,
  rippleLanes,
  rippleLanesCsv,
  rippleLength,
  rippleLetter,
  rippleLower,
  rippleMixed,
  rippleOpen,
  ripplePeriod,
  rippleRowsCsv,
  rippleShare,
  rippleSpace,
  rippleStamp,
  rippleTail,
  rippleUpper,
  rippleVowel,
  idleHorologium,
  laneRippleCount,
  lateHorologium,
  leadingRipple,
  leadingRippleHue,
  liftNotchFocused,
  lowerVaneFocused,
  lowerNotchFocused,
  moveHorologiumFocus,
  horologiumBars,
  horologiumCopy,
  horologiumCounts,
  horologiumCsv,
  horologiumDensity,
  horologiumInner,
  horologiumOuter,
  horologiumBearers,
  horologiumTimeline,
  overdueHorologium,
  presentRippleLanes,
  raiseVaneFocused,
  readHiddenRipples,
  readHorologiumViews,
  readHorologiumRules,
  readReviewedRipples,
  reminderHorologiumRules,
  restingHorologium,
  setHorologiumFocused,
  setHorologiumVault,
  setHorologiumSighted,
  setHorologiumRack,
  setHorologiumStar,
  setHorologiumWood,
  sortHorologiumRules,
  starHorologiumFocused,
  suggestNotch,
  suggestStaff,
  suggestWood,
  toggleRipple,
  toggleRippleReview,
  visibleRippleLanes,
  visibleRipples,
  visibleHorologiumRules,
  woodFocused,
  rackHorologiumFocused,
  type RippleReview,
  type RippleRow,
  type RippleShape,
  type RippleValue,
  type HorologiumDensity,
  type HorologiumSort,
  type HorologiumTray,
  type HorologiumView,
  type Horologium,
} from "@/lib/crmv4/round314";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const WOODS = ["BRONZE", "GLASS", "CLAY"] as const;
const NOTCHES = ["5", "10", "20", "40"] as const;
const VANES = ["1", "3", "9"] as const;

const CLIMATE_KEY: Record<string, CrmV4CopyKey> = {
  basin: "ckdReed",
  spout: "ckdWand",
  float: "ckdPole",
  tank: "ckdMast",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "ckdAuditSave",
  edit: "ckdAuditEdit",
  note: "ckdAuditNote",
  wood: "ckdAuditWood",
  set: "ckdAuditSet",
  clear: "ckdAuditClear",
  sheath: "ckdAuditRack",
  resume: "ckdAuditResume",
  crypt: "ckdAuditCase",
  open: "ckdAuditOpen",
  tag: "ckdAuditTag",
  vane: "ckdAuditVane",
  notch: "ckdAuditNotch",
  lower: "ckdAuditLowerNotch",
  star: "ckdAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  house: "rplHouse",
  fort: "rplFort",
  harbor: "rplHarbor",
  digit: "rplDigit",
  spark: "rplSpark",
  scroll: "rplScroll",
  vowel: "rplVowel",
  post: "rplPost",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "rplChampagne",
  ivory: "rplIvory",
  graphite: "rplGraphite",
};

const SHAPE_KEY: Record<RippleShape, CrmV4CopyKey> = {
  all: "rplShapeAll",
  house: "rplShapeHouse",
  fort: "rplShapeFort",
  harbor: "rplShapeHarbor",
  digit: "rplShapeDigit",
  spark: "rplShapeSpark",
  scroll: "rplShapeScroll",
  vowel: "rplShapeVowel",
  post: "rplShapePost",
  open: "rplShapeOpen",
  soon: "rplShapeSoon",
  letter: "rplShapeLetter",
  mixed: "rplShapeMixed",
  upper: "rplShapeUpper",
  lower: "rplShapeLower",
  space: "rplShapeSpace",
  even: "rplShapeEven",
  odd: "rplShapeOdd",
  tail: "rplShapeTail",
  first: "rplShapeFirst",
  cased: "rplShapeHeld",
  hyphen: "rplShapeHyphen",
  period: "rplShapePeriod",
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
  return key ? v4(key) : v4("ckdBlankBoard");
}

function woodLabel(v4: V4, wood: string): string {
  if (wood === "BRONZE") return v4("ckdLime");
  if (wood === "GLASS") return v4("ckdYew");
  if (wood === "CLAY") return v4("ckdOak");
  return v4("ckdAll");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("rplUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("rplUnmarked");
}

export function HorologiumRules({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Horologium[]>([]);
  const [views, setViews] = useState<HorologiumView[]>([]);
  const [density, setDensity] = useState<HorologiumDensity>("broad");
  const [tray, setTray] = useState<HorologiumTray>("yard");
  const [query, setQuery] = useState("");
  const [bearerFilter, setBearerFilter] = useState("");
  const [woodFilter, setWoodFilter] = useState("all");
  const [staffFilter, setStaffFilter] = useState("all");
  const [notchFilter, setNotchFilter] = useState("all");
  const [vaneFilter, setVaneFilter] = useState("all");
  const [sort, setSort] = useState<HorologiumSort>("staff");
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
  const [desk, setDesk] = useState("basin");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readHorologiumRules(readJson(CKD_KEY, [])));
    setViews(readHorologiumViews(readJson(CKD_VIEW_KEY, [])));
    setDensity(horologiumDensity(readJson(CKD_DENSITY_KEY, "broad")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Horologium[]) {
    setCards(next);
    writeJson(CKD_KEY, next);
  }
  function storeViews(next: HorologiumView[]) {
    setViews(next);
    writeJson(CKD_VIEW_KEY, next);
  }
  function storeDensity(next: HorologiumDensity) {
    setDensity(next);
    writeJson(CKD_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortHorologiumRules(visibleHorologiumRules(cards, tray, query, bearerFilter, woodFilter, staffFilter, notchFilter, vaneFilter), sort),
    [cards, tray, query, bearerFilter, woodFilter, staffFilter, notchFilter, vaneFilter, sort],
  );
  const counts = horologiumCounts(cards, shown, desk);
  const bars = horologiumBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = horologiumTimeline(cards);
  const bearers = horologiumBearers(cards);
  const suggested = suggestWood(cards);
  const fair = fairBearer(cards, bearers.join(","));
  const busy = busiestBearer(cards);
  const reminders = reminderHorologiumRules(cards);
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
        setFocusAt((index) => moveHorologiumFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocusAt((index) => moveHorologiumFocus(index, shown.length, -1));
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
        store(setHorologiumVault(cards, id, !shown[focusAt]?.cased));
        return;
      }
      if (event.key === "m" || event.key === "M") {
        event.preventDefault();
        store(woodFocused(cards, id));
        return;
      }
      if (event.key === "c" || event.key === "C") {
        event.preventDefault();
        store(rackHorologiumFocused(cards, id));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        store(setHorologiumFocused(cards, id));
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("horologium-rules.csv", horologiumCsv(shown, desk));
        return;
      }
      if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        store(starHorologiumFocused(cards, id));
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
    <section className="c4-horologium" aria-label={v4("ckdTitle")} data-cards="1" data-desk={tray} data-names="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-horologium-mast">
        <p className="c4-horologium-seal" data-logo="mono">{v4("ckdLogo")}</p>
        <div>
          <p className="c4-horologium-kicker">{v4("ckdSub")}</p>
          <h2 className="c4-title">{v4("ckdTitle")}</h2>
        </div>
        <p className="c4-horologium-count">{counts.matched}</p>
      </header>
      <ol className="c4-horologium-index" aria-label={v4("ckdTitle")}>
        <li data-tone="gold">{v4("ckdBoard")} {counts.court}</li>
        <li data-tone="ink">{v4("ckdOverdue")} {counts.overdue}</li>
        <li data-tone="ivory">{v4("ckdHouse")} {counts.house}</li>
      </ol>
      <p className="c4-horologium-links">
        <Link href={crmv4Href(base, "rpl")}>{v4("rplTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("ckdCustomers")}</Link>
      </p>
      <p className="c4-horologium-hint">{v4("ckdHint")}</p>
      {viewer && <p className="c4-horologium-note">{v4("ckdViewer")}</p>}
      {counts.overdue > 0 && <p className="c4-horologium-notice" role="status">{v4("ckdOverdue")} {counts.overdue}</p>}
      <ol className="c4-horologium-dials" aria-label={v4("ckdChart")}>
        <li>{v4("ckdBoard")} {counts.court}</li>
        <li>{v4("ckdRack")} {counts.rack}</li>
        <li>{v4("ckdCase")} {counts.vault}</li>
        <li>{v4("ckdInner")} {counts.inner}</li>
        <li>{v4("ckdOuter")} {counts.outer}</li>
        <li>{v4("ckdWide")} {counts.wide}</li>
        <li>{v4("ckdStar")} {counts.starred}</li>
        <li>{v4("ckdIdle")} {counts.idle}</li>
        <li>{v4("ckdBrisk")} {counts.brisk}</li>
        <li>{v4("ckdResting")} {counts.resting}</li>
      </ol>
      <div className="c4-horologium-chart" aria-label={v4("ckdChart")}>
        {bars.map((bar) => (
          <button key={bar.staff} type="button" className="c4-horologium-column" data-on={staffFilter === bar.staff ? "1" : "0"} data-staff={bar.staff} onClick={() => setStaffFilter(staffFilter === bar.staff ? "all" : bar.staff)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{staffLabel(v4, bar.staff)}</span>
          </button>
        ))}
      </div>
      <div className="c4-horologium-tools">
        <input ref={searchRef} className="c4-field c4-horologium-search" aria-label={v4("ckdSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("ckdSearch")} />
        {(["yard", "rack", "case"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "yard" ? "ckdBoard" : item === "rack" ? "ckdRack" : "ckdCase")}</button>
        ))}
        {(["all", "inner", "outer", ...CKD_STAVES] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={staffFilter === item ? "1" : "0"} onClick={() => setStaffFilter(item)}>{item === "all" ? v4("ckdAll") : item === "inner" ? v4("ckdInner") : item === "outer" ? v4("ckdOuter") : staffLabel(v4, item)}</button>
        ))}
        {(["all", ...WOODS] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={woodFilter === item ? "1" : "0"} onClick={() => setWoodFilter(item)}>{item === "all" ? v4("ckdAll") : woodLabel(v4, item)}</button>
        ))}
        {(["all", ...NOTCHES] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={notchFilter === item ? "1" : "0"} onClick={() => setNotchFilter(item)}>{item === "all" ? v4("ckdNotch") : item}</button>
        ))}
        {(["all", ...VANES] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={vaneFilter === item ? "1" : "0"} onClick={() => setVaneFilter(item)}>{item === "all" ? v4("ckdVane") : item}</button>
        ))}
        <button type="button" className="c4-chip" data-on={sort === "staff" ? "1" : "0"} onClick={() => setSort("staff")}>{v4("ckdSortBoard")}</button>
        <button type="button" className="c4-chip" data-on={sort === "bearer" ? "1" : "0"} onClick={() => setSort("bearer")}>{v4("ckdSortBearer")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "broad" : "tight")}>{density === "tight" ? v4("ckdTight") : v4("ckdBroad")}</button>
        {CKD_STAVES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={desk === item ? "1" : "0"} onClick={() => setDesk(item)}>{v4("ckdDesk")} {staffLabel(v4, item)}</button>
        ))}
        {bearers.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={bearerFilter === name ? "1" : "0"} onClick={() => setBearerFilter(bearerFilter === name ? "" : name)}>{name}</button>
        ))}
      </div>
      <p className="c4-horologium-meta">{v4("ckdSuggest")} {woodLabel(v4, suggested)} · {notchHint} · {staffLabel(v4, staffHint)} · {v4("ckdFair")} {fair || "—"} · {v4("ckdBusy")} {busy || "—"}</p>
      {reminders.length > 0 && (
        <ul className="c4-horologium-remind" aria-label={v4("ckdRemind")}>
          {reminders.map((item) => <li key={item}>{item}</li>)}
        </ul>
      )}
      {timeline.length > 0 && (
        <ol className="c4-horologium-time" aria-label={v4("ckdTimeline")}>
          {timeline.map((lane) => <li key={lane.notch}>{lane.notch} · {lane.titles.join(" · ")}</li>)}
        </ol>
      )}
      <form className="c4-horologium-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addHorologium(cards, { title, note, bearer, staff, wood, notch: notchNo, vane: vaneNo, tags });
        if (next.length === cards.length) return;
        store(next);
        setTitle("");
        setNote("");
        setTags("");
      }}>
        <input className="c4-field" aria-label={v4("ckdEdit")} aria-required={false} value={title} onChange={(event) => setTitle(event.target.value)} placeholder={v4("ckdEdit")} disabled={viewer} />
        <input className="c4-field" aria-label={v4("ckdNote")} aria-required={false} value={note} onChange={(event) => setNote(event.target.value)} placeholder={v4("ckdNote")} disabled={viewer} />
        <input className="c4-field" aria-label={v4("ckdBearer")} aria-required={false} value={bearer} onChange={(event) => setBearer(event.target.value)} placeholder={v4("ckdBearer")} disabled={viewer} />
        <select className="c4-select" aria-label={v4("ckdDesk")} value={staff} onChange={(event) => setStaff(event.target.value)} disabled={viewer}>
          <option value="">{v4("ckdBlankBoard")}</option>
          {CKD_STAVES.map((item) => <option key={item} value={item}>{staffLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("ckdWood")} value={wood} onChange={(event) => setWood(event.target.value)} disabled={viewer}>
          <option value="">{v4("ckdWood")}</option>
          {WOODS.map((item) => <option key={item} value={item}>{woodLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("ckdNotch")} value={notchNo} onChange={(event) => setNotchNo(event.target.value)} disabled={viewer}>
          <option value="">{v4("ckdNotch")}</option>
          {NOTCHES.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("ckdVane")} value={vaneNo} onChange={(event) => setVaneNo(event.target.value)} disabled={viewer}>
          <option value="">{v4("ckdVane")}</option>
          {VANES.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <input className="c4-field" aria-label={v4("ckdTag")} aria-required={false} value={tags} onChange={(event) => setTags(event.target.value)} placeholder={v4("ckdTag")} disabled={viewer} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("ckdAdd")}</button>
      </form>
      <form className="c4-horologium-views" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addHorologiumView(views, { id: `v${Date.now().toString(36)}`, name: viewName, tray, query, bearer: bearerFilter, wood: woodFilter, staff: staffFilter, notch: notchFilter, vane: vaneFilter });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <input className="c4-field" aria-label={v4("ckdViewName")} aria-required={false} value={viewName} onChange={(event) => setViewName(event.target.value)} placeholder={v4("ckdViewName")} disabled={viewer} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("ckdSaveView")}</button>
        {views.map((view) => (
          <span key={view.id} className="c4-horologium-view">
            <button type="button" className="c4-chip" onClick={() => { setTray(view.tray); setQuery(view.query); setBearerFilter(view.bearer); setWoodFilter(view.wood); setStaffFilter(view.staff); setNotchFilter(view.notch); setVaneFilter(view.vane); }}>{v4("ckdApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropHorologiumView(views, view.id))}>{v4("ckdDrop")}</button>
          </span>
        ))}
      </form>
      <div className="c4-horologium-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkHorologiumSighted(cards, picked))}>{v4("ckdBulkLaid")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkHorologiumOak(cards, picked))}>{v4("ckdBulkOak")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkHorologiumVault(cards, picked))}>{v4("ckdBulkCrypt")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkHorologiumTag(cards, picked))}>{v4("ckdBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("horologium-rules.csv", horologiumCsv(shown, desk))}>{v4("ckdCsv")}</button>
      </div>
      <p className="c4-horologium-keys">{v4("ckdKeys")} j k / p o u d m c a s v x</p>
      {!shown.length && <p className="c4-pay-empty">{v4("ckdEmpty")}</p>}
      <ul className="c4-horologium-list" data-density={density}>
        {shown.map((card) => {
          const auditKey = AUDIT_KEY[card.audit];
          return (
            <li key={card.id} className="c4-horologium-card" data-on={focused?.id === card.id ? "1" : "0"} data-staff={card.staff || "blank"} data-late={lateHorologium(card, desk) ? "1" : "0"} data-idle={idleHorologium(card) ? "1" : "0"} data-brisk={briskHorologium(card) ? "1" : "0"} data-resting={restingHorologium(card) ? "1" : "0"} data-overdue={overdueHorologium(card) ? "1" : "0"} data-inner={horologiumInner(card.staff) ? "1" : "0"} data-outer={horologiumOuter(card.staff) ? "1" : "0"}>
              <label className="c4-horologium-pick">
                <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
              </label>
              <div>
                <input className="c4-field" aria-label={v4("ckdEdit")} aria-required={false} defaultValue={card.title} disabled={viewer} onBlur={(event) => store(editHorologium(cards, card.id, event.target.value))} />
                <input className="c4-field" aria-label={v4("ckdNote")} aria-required={false} defaultValue={card.note} disabled={viewer} onBlur={(event) => store(editHorologiumNote(cards, card.id, event.target.value))} />
                <p className="c4-horologium-meta">{card.bearer || "—"} · {staffLabel(v4, card.staff)} · {woodLabel(v4, card.wood)} · {card.notch ?? "—"} · {card.vane} · {card.tags.join(" ") || "—"}</p>
                {auditKey && <p className="c4-horologium-audit">{v4(auditKey)}</p>}
              </div>
              <div className="c4-horologium-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setHorologiumSighted(cards, card.id, !card.sighted))}>{card.sighted ? v4("ckdClear") : v4("ckdLay")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setHorologiumWood(cards, card.id, suggested))}>{v4("ckdSuggest")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setHorologiumRack(cards, card.id, !card.racked))}>{card.racked ? v4("ckdUnrack") : v4("ckdRackIt")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setHorologiumVault(cards, card.id, !card.cased))}>{card.cased ? v4("ckdUncase") : v4("ckdCaseIt")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setHorologiumStar(cards, card.id, !card.starred))}>{card.starred ? v4("ckdUnstar") : v4("ckdStar")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addHorologiumTag(cards, card.id, "e"))}>{v4("ckdTag")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(liftNotchFocused(cards, card.id))}>{v4("ckdLift")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerNotchFocused(cards, card.id))}>{v4("ckdLower")}</button>
                <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(horologiumCopy(card))}>{v4("ckdCopy")}</button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

type RippleUser = { id?: string; name?: string | null; lastIp?: boolean | string | number | null };

export function RipplePlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: RippleUser[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<RippleShape>("all");
  const [review, setReview] = useState<RippleReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): RippleRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      ripple: { lastIp: textField(row.lastIp) } satisfies RippleValue,
    };
  }).filter((row): row is RippleRow => Boolean(row));
  const present = presentRippleLanes(rows);
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
    const next = readHiddenRipples(readJson(RPL_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(RPL_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedRipples(readJson(RPL_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(RPL_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleRippleLanes(present, hidden, showHidden);
  const shown = visibleRipples(rows, lanes.includes(lane) || lane === "all" ? lane : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = rippleLane(row.ripple);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = rippleLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingRipple(rows);
  const leadHue = leadingRippleHue(rows);
  const whole = rows.filter((row) => rippleLane(row.ripple)).length;
  const share = rippleShare(laneRippleCount(rows, "house"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("ripple-lanes.csv", rippleLanesCsv(rows));
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
    writeJson(RPL_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(RPL_REVIEW_KEY, next);
  }

  return (
    <section className="c4-ripple" aria-label={v4("rplTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-ripple-mast">
        <p className="c4-ripple-seal" data-logo="mono">{v4("rplLogo")}</p>
        <div>
          <p className="c4-ripple-kicker">{v4("rplSub")}</p>
          <h2 className="c4-title">{v4("rplTitle")}</h2>
        </div>
        <p className="c4-ripple-count">{shown.length}</p>
      </header>
      <p className="c4-ripple-links">
        <Link href={crmv4Href(base, "ckd")}>{v4("ckdTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("rplCustomer")}</Link>
      </p>
      <p className="c4-ripple-hint">{v4("rplHint")}</p>
      {viewer && <p className="c4-ripple-note">{v4("rplViewer")}</p>}
      <p className="c4-ripple-meta">{v4("rplLead")} {laneLabel(v4, lead)} · {v4("rplToneLead")} {hueLabel(v4, leadHue)} · {v4("rplShare")} {share}</p>
      <div className="c4-ripple-chart" aria-label={v4("rplChart")}>
        {lines.map((line) => (
          <button key={line.lane} type="button" className="c4-ripple-column" data-on={lane === line.lane ? "1" : "0"} data-lane={line.lane} onClick={() => setLane(lane === line.lane ? "all" : line.lane)}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-ripple-tools">
        <input ref={searchRef} className="c4-field c4-ripple-search" aria-label={v4("rplSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("rplSearch")} />
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("rplShow")}</button>
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{v4(item === "all" ? "rplAll" : item === "reviewed" ? "rplReviewed" : "rplFresh")}</button>
        ))}
        {(["all", "champagne", "ivory", "graphite"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("rplAll") : hueLabel(v4, item)}</button>
        ))}
        {(Object.keys(SHAPE_KEY) as RippleShape[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" onClick={() => storeHidden(toggleRipple(hidden, item))}>{hidden.includes(item) ? v4("rplShow") : v4("rplHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-ripple-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkRippleReview(reviewed, picked, true))}>{v4("rplBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkRippleReview(reviewed, picked, false))}>{v4("rplBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("ripple-lanes.csv", rippleLanesCsv(rows))}>{v4("rplCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("ripple-rows.csv", rippleRowsCsv(shown, reviewed))}>{v4("rplRowCsv")}</button>
      </div>
      {queue.loading && !rows.length && <p className="c4-meta">{v4("rplLoading")}</p>}
      {queue.error && <p className="c4-meta">{v4("rplFailed")}</p>}
      {!queue.loading && !queue.error && !rows.length && <p className="c4-pay-empty">{v4("rplEmpty")}</p>}
      <ul className="c4-ripple-list">
        {shown.map((row) => {
          const name = rippleCopy(row.ripple);
          const tone = rippleHue(row.ripple);
          return (
            <li key={row.id} className="c4-ripple-card" data-lane={rippleLane(row.ripple) || "open"} data-hue={tone || "none"} data-house={rippleHouseSafe(row.ripple)} data-open={rippleOpen(row.ripple) ? "1" : "0"} data-even={rippleEven(row.ripple) ? "1" : "0"} data-digit={rippleDigit(row.ripple) ? "1" : "0"} data-letter={rippleLetter(row.ripple) ? "1" : "0"} data-mixed={rippleMixed(row.ripple) ? "1" : "0"} data-upper={rippleUpper(row.ripple) ? "1" : "0"} data-lower={rippleLower(row.ripple) ? "1" : "0"} data-space={rippleSpace(row.ripple) ? "1" : "0"} data-vowel={rippleVowel(row.ripple) ? "1" : "0"} data-tail={rippleTail(row.ripple) ? "1" : "0"} data-first={rippleFirst(row.ripple) ? "1" : "0"} data-cased={rippleHeld(row.ripple) ? "1" : "0"} data-hyphen={rippleHyphen(row.ripple) ? "1" : "0"} data-period={ripplePeriod(row.ripple) ? "1" : "0"} data-capital={rippleCapital(row.ripple) ? "1" : "0"}>
              <label className="c4-ripple-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-ripple-meta">{name || v4("rplOpen")} · {rippleStamp(row.ripple) || "—"} · {rippleFamily(row.ripple) || "—"} · {rippleLength(row.ripple) ?? "—"} · {laneLabel(v4, rippleLane(row.ripple))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-ripple-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleRippleReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("rplReviewed") : v4("rplReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const text = rippleCopy(row.ripple); if (!text) return; navigator.clipboard?.writeText(text); setCopied(row.id); }}>{copied === row.id ? v4("rplCopied") : v4("rplCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("rplCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function rippleHouseSafe(raw: RippleValue): string {
  return rippleLane(raw) === "house" ? "1" : "0";
}
