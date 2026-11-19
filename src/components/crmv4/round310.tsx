"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  DTM_KEY,
  DTM_REVIEW_KEY,
  CHB_STAVES,
  CHB_DENSITY_KEY,
  CHB_KEY,
  CHB_VIEW_KEY,
  addChorobatesTag,
  addChorobatesView,
  addChorobates,
  briskChorobates,
  bulkDatumReview,
  bulkChorobatesVault,
  bulkChorobatesSighted,
  bulkChorobatesTag,
  bulkChorobatesOak,
  busiestBearer,
  dropChorobatesView,
  editChorobatesNote,
  editChorobates,
  fairBearer,
  datumCapital,
  datumCopy,
  datumDigit,
  datumEven,
  datumFamily,
  datumFirst,
  datumHeld,
  datumHue,
  datumHyphen,
  datumLane,
  datumLanes,
  datumLanesCsv,
  datumLength,
  datumLetter,
  datumLower,
  datumMixed,
  datumOpen,
  datumPeriod,
  datumRowsCsv,
  datumShare,
  datumSpace,
  datumStamp,
  datumTail,
  datumUpper,
  datumVowel,
  idleChorobates,
  laneDatumCount,
  lateChorobates,
  leadingDatum,
  leadingDatumHue,
  liftNotchFocused,
  lowerVaneFocused,
  lowerNotchFocused,
  moveChorobatesFocus,
  chorobatesBars,
  chorobatesCopy,
  chorobatesCounts,
  chorobatesCsv,
  chorobatesDensity,
  chorobatesInner,
  chorobatesOuter,
  chorobatesBearers,
  chorobatesTimeline,
  overdueChorobates,
  presentDatumLanes,
  raiseVaneFocused,
  readHiddenDatums,
  readChorobatesViews,
  readChorobatesRules,
  readReviewedDatums,
  reminderChorobatesRules,
  restingChorobates,
  setChorobatesFocused,
  setChorobatesVault,
  setChorobatesSighted,
  setChorobatesRack,
  setChorobatesStar,
  setChorobatesWood,
  sortChorobatesRules,
  starChorobatesFocused,
  suggestNotch,
  suggestStaff,
  suggestWood,
  toggleDatum,
  toggleDatumReview,
  visibleDatumLanes,
  visibleDatums,
  visibleChorobatesRules,
  woodFocused,
  rackChorobatesFocused,
  type DatumReview,
  type DatumRow,
  type DatumShape,
  type DatumValue,
  type ChorobatesDensity,
  type ChorobatesSort,
  type ChorobatesTray,
  type ChorobatesView,
  type Chorobates,
} from "@/lib/crmv4/round310";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const WOODS = ["ASH", "ELM", "BOX"] as const;
const NOTCHES = ["4", "8", "16", "32"] as const;
const VANES = ["1", "5", "8"] as const;

const CLIMATE_KEY: Record<string, CrmV4CopyKey> = {
  beam: "chbReed",
  sill: "chbWand",
  pier: "chbPole",
  arch: "chbMast",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "chbAuditSave",
  edit: "chbAuditEdit",
  note: "chbAuditNote",
  wood: "chbAuditWood",
  set: "chbAuditSet",
  clear: "chbAuditClear",
  sheath: "chbAuditRack",
  resume: "chbAuditResume",
  crypt: "chbAuditCase",
  open: "chbAuditOpen",
  tag: "chbAuditTag",
  vane: "chbAuditVane",
  notch: "chbAuditNotch",
  lower: "chbAuditLowerNotch",
  star: "chbAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  house: "dtmHouse",
  fort: "dtmFort",
  harbor: "dtmHarbor",
  digit: "dtmDigit",
  spark: "dtmSpark",
  scroll: "dtmScroll",
  vowel: "dtmVowel",
  post: "dtmPost",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "dtmChampagne",
  ivory: "dtmIvory",
  graphite: "dtmGraphite",
};

const SHAPE_KEY: Record<DatumShape, CrmV4CopyKey> = {
  all: "dtmShapeAll",
  house: "dtmShapeHouse",
  fort: "dtmShapeFort",
  harbor: "dtmShapeHarbor",
  digit: "dtmShapeDigit",
  spark: "dtmShapeSpark",
  scroll: "dtmShapeScroll",
  vowel: "dtmShapeVowel",
  post: "dtmShapePost",
  open: "dtmShapeOpen",
  soon: "dtmShapeSoon",
  letter: "dtmShapeLetter",
  mixed: "dtmShapeMixed",
  upper: "dtmShapeUpper",
  lower: "dtmShapeLower",
  space: "dtmShapeSpace",
  even: "dtmShapeEven",
  odd: "dtmShapeOdd",
  tail: "dtmShapeTail",
  first: "dtmShapeFirst",
  cased: "dtmShapeHeld",
  hyphen: "dtmShapeHyphen",
  period: "dtmShapePeriod",
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
  return key ? v4(key) : v4("chbBlankBoard");
}

function woodLabel(v4: V4, wood: string): string {
  if (wood === "ASH") return v4("chbLime");
  if (wood === "ELM") return v4("chbYew");
  if (wood === "BOX") return v4("chbOak");
  return v4("chbAll");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("dtmUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("dtmUnmarked");
}

export function ChorobatesRules({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Chorobates[]>([]);
  const [views, setViews] = useState<ChorobatesView[]>([]);
  const [density, setDensity] = useState<ChorobatesDensity>("broad");
  const [tray, setTray] = useState<ChorobatesTray>("yard");
  const [query, setQuery] = useState("");
  const [bearerFilter, setBearerFilter] = useState("");
  const [woodFilter, setWoodFilter] = useState("all");
  const [staffFilter, setStaffFilter] = useState("all");
  const [notchFilter, setNotchFilter] = useState("all");
  const [vaneFilter, setVaneFilter] = useState("all");
  const [sort, setSort] = useState<ChorobatesSort>("staff");
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
  const [desk, setDesk] = useState("beam");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readChorobatesRules(readJson(CHB_KEY, [])));
    setViews(readChorobatesViews(readJson(CHB_VIEW_KEY, [])));
    setDensity(chorobatesDensity(readJson(CHB_DENSITY_KEY, "broad")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Chorobates[]) {
    setCards(next);
    writeJson(CHB_KEY, next);
  }
  function storeViews(next: ChorobatesView[]) {
    setViews(next);
    writeJson(CHB_VIEW_KEY, next);
  }
  function storeDensity(next: ChorobatesDensity) {
    setDensity(next);
    writeJson(CHB_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortChorobatesRules(visibleChorobatesRules(cards, tray, query, bearerFilter, woodFilter, staffFilter, notchFilter, vaneFilter), sort),
    [cards, tray, query, bearerFilter, woodFilter, staffFilter, notchFilter, vaneFilter, sort],
  );
  const counts = chorobatesCounts(cards, shown, desk);
  const bars = chorobatesBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = chorobatesTimeline(cards);
  const bearers = chorobatesBearers(cards);
  const suggested = suggestWood(cards);
  const fair = fairBearer(cards, bearers.join(","));
  const busy = busiestBearer(cards);
  const reminders = reminderChorobatesRules(cards);
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
        setFocusAt((index) => moveChorobatesFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocusAt((index) => moveChorobatesFocus(index, shown.length, -1));
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
        store(setChorobatesVault(cards, id, !shown[focusAt]?.cased));
        return;
      }
      if (event.key === "m" || event.key === "M") {
        event.preventDefault();
        store(woodFocused(cards, id));
        return;
      }
      if (event.key === "c" || event.key === "C") {
        event.preventDefault();
        store(rackChorobatesFocused(cards, id));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        store(setChorobatesFocused(cards, id));
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("chorobates-rules.csv", chorobatesCsv(shown, desk));
        return;
      }
      if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        store(starChorobatesFocused(cards, id));
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
    <section className="c4-chorobates" aria-label={v4("chbTitle")} data-cards="1" data-desk={tray} data-names="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-chorobates-mast">
        <p className="c4-chorobates-seal" data-logo="mono">{v4("chbLogo")}</p>
        <div>
          <p className="c4-chorobates-kicker">{v4("chbSub")}</p>
          <h2 className="c4-title">{v4("chbTitle")}</h2>
        </div>
        <p className="c4-chorobates-count">{counts.matched}</p>
      </header>
      <ol className="c4-chorobates-index" aria-label={v4("chbTitle")}>
        <li data-tone="gold">{v4("chbBoard")} {counts.court}</li>
        <li data-tone="ink">{v4("chbOverdue")} {counts.overdue}</li>
        <li data-tone="ivory">{v4("chbHouse")} {counts.house}</li>
      </ol>
      <p className="c4-chorobates-links">
        <Link href={crmv4Href(base, "dtm")}>{v4("dtmTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("chbCustomers")}</Link>
      </p>
      <p className="c4-chorobates-hint">{v4("chbHint")}</p>
      {viewer && <p className="c4-chorobates-note">{v4("chbViewer")}</p>}
      {counts.overdue > 0 && <p className="c4-chorobates-notice" role="status">{v4("chbOverdue")} {counts.overdue}</p>}
      <ol className="c4-chorobates-dials" aria-label={v4("chbChart")}>
        <li>{v4("chbBoard")} {counts.court}</li>
        <li>{v4("chbRack")} {counts.rack}</li>
        <li>{v4("chbCase")} {counts.vault}</li>
        <li>{v4("chbInner")} {counts.inner}</li>
        <li>{v4("chbOuter")} {counts.outer}</li>
        <li>{v4("chbWide")} {counts.wide}</li>
        <li>{v4("chbStar")} {counts.starred}</li>
        <li>{v4("chbIdle")} {counts.idle}</li>
        <li>{v4("chbBrisk")} {counts.brisk}</li>
        <li>{v4("chbResting")} {counts.resting}</li>
      </ol>
      <div className="c4-chorobates-chart" aria-label={v4("chbChart")}>
        {bars.map((bar) => (
          <button key={bar.staff} type="button" className="c4-chorobates-column" data-on={staffFilter === bar.staff ? "1" : "0"} data-staff={bar.staff} onClick={() => setStaffFilter(staffFilter === bar.staff ? "all" : bar.staff)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{staffLabel(v4, bar.staff)}</span>
          </button>
        ))}
      </div>
      <div className="c4-chorobates-tools">
        <input ref={searchRef} className="c4-field c4-chorobates-search" aria-label={v4("chbSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("chbSearch")} />
        {(["yard", "rack", "case"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "yard" ? "chbBoard" : item === "rack" ? "chbRack" : "chbCase")}</button>
        ))}
        {(["all", "inner", "outer", ...CHB_STAVES] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={staffFilter === item ? "1" : "0"} onClick={() => setStaffFilter(item)}>{item === "all" ? v4("chbAll") : item === "inner" ? v4("chbInner") : item === "outer" ? v4("chbOuter") : staffLabel(v4, item)}</button>
        ))}
        {(["all", ...WOODS] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={woodFilter === item ? "1" : "0"} onClick={() => setWoodFilter(item)}>{item === "all" ? v4("chbAll") : woodLabel(v4, item)}</button>
        ))}
        {(["all", ...NOTCHES] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={notchFilter === item ? "1" : "0"} onClick={() => setNotchFilter(item)}>{item === "all" ? v4("chbNotch") : item}</button>
        ))}
        {(["all", ...VANES] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={vaneFilter === item ? "1" : "0"} onClick={() => setVaneFilter(item)}>{item === "all" ? v4("chbVane") : item}</button>
        ))}
        <button type="button" className="c4-chip" data-on={sort === "staff" ? "1" : "0"} onClick={() => setSort("staff")}>{v4("chbSortBoard")}</button>
        <button type="button" className="c4-chip" data-on={sort === "bearer" ? "1" : "0"} onClick={() => setSort("bearer")}>{v4("chbSortBearer")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "broad" : "tight")}>{density === "tight" ? v4("chbTight") : v4("chbBroad")}</button>
        {CHB_STAVES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={desk === item ? "1" : "0"} onClick={() => setDesk(item)}>{v4("chbDesk")} {staffLabel(v4, item)}</button>
        ))}
        {bearers.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={bearerFilter === name ? "1" : "0"} onClick={() => setBearerFilter(bearerFilter === name ? "" : name)}>{name}</button>
        ))}
      </div>
      <p className="c4-chorobates-meta">{v4("chbSuggest")} {woodLabel(v4, suggested)} · {notchHint} · {staffLabel(v4, staffHint)} · {v4("chbFair")} {fair || "—"} · {v4("chbBusy")} {busy || "—"}</p>
      {reminders.length > 0 && (
        <ul className="c4-chorobates-remind" aria-label={v4("chbRemind")}>
          {reminders.map((item) => <li key={item}>{item}</li>)}
        </ul>
      )}
      {timeline.length > 0 && (
        <ol className="c4-chorobates-time" aria-label={v4("chbTimeline")}>
          {timeline.map((lane) => <li key={lane.notch}>{lane.notch} · {lane.titles.join(" · ")}</li>)}
        </ol>
      )}
      <form className="c4-chorobates-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addChorobates(cards, { title, note, bearer, staff, wood, notch: notchNo, vane: vaneNo, tags });
        if (next.length === cards.length) return;
        store(next);
        setTitle("");
        setNote("");
        setTags("");
      }}>
        <input className="c4-field" aria-label={v4("chbEdit")} aria-required={false} value={title} onChange={(event) => setTitle(event.target.value)} placeholder={v4("chbEdit")} disabled={viewer} />
        <input className="c4-field" aria-label={v4("chbNote")} aria-required={false} value={note} onChange={(event) => setNote(event.target.value)} placeholder={v4("chbNote")} disabled={viewer} />
        <input className="c4-field" aria-label={v4("chbBearer")} aria-required={false} value={bearer} onChange={(event) => setBearer(event.target.value)} placeholder={v4("chbBearer")} disabled={viewer} />
        <select className="c4-select" aria-label={v4("chbDesk")} value={staff} onChange={(event) => setStaff(event.target.value)} disabled={viewer}>
          <option value="">{v4("chbBlankBoard")}</option>
          {CHB_STAVES.map((item) => <option key={item} value={item}>{staffLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("chbWood")} value={wood} onChange={(event) => setWood(event.target.value)} disabled={viewer}>
          <option value="">{v4("chbWood")}</option>
          {WOODS.map((item) => <option key={item} value={item}>{woodLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("chbNotch")} value={notchNo} onChange={(event) => setNotchNo(event.target.value)} disabled={viewer}>
          <option value="">{v4("chbNotch")}</option>
          {NOTCHES.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("chbVane")} value={vaneNo} onChange={(event) => setVaneNo(event.target.value)} disabled={viewer}>
          <option value="">{v4("chbVane")}</option>
          {VANES.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <input className="c4-field" aria-label={v4("chbTag")} aria-required={false} value={tags} onChange={(event) => setTags(event.target.value)} placeholder={v4("chbTag")} disabled={viewer} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("chbAdd")}</button>
      </form>
      <form className="c4-chorobates-views" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addChorobatesView(views, { id: `v${Date.now().toString(36)}`, name: viewName, tray, query, bearer: bearerFilter, wood: woodFilter, staff: staffFilter, notch: notchFilter, vane: vaneFilter });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <input className="c4-field" aria-label={v4("chbViewName")} aria-required={false} value={viewName} onChange={(event) => setViewName(event.target.value)} placeholder={v4("chbViewName")} disabled={viewer} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("chbSaveView")}</button>
        {views.map((view) => (
          <span key={view.id} className="c4-chorobates-view">
            <button type="button" className="c4-chip" onClick={() => { setTray(view.tray); setQuery(view.query); setBearerFilter(view.bearer); setWoodFilter(view.wood); setStaffFilter(view.staff); setNotchFilter(view.notch); setVaneFilter(view.vane); }}>{v4("chbApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropChorobatesView(views, view.id))}>{v4("chbDrop")}</button>
          </span>
        ))}
      </form>
      <div className="c4-chorobates-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkChorobatesSighted(cards, picked))}>{v4("chbBulkLaid")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkChorobatesOak(cards, picked))}>{v4("chbBulkOak")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkChorobatesVault(cards, picked))}>{v4("chbBulkCrypt")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkChorobatesTag(cards, picked))}>{v4("chbBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("chorobates-rules.csv", chorobatesCsv(shown, desk))}>{v4("chbCsv")}</button>
      </div>
      <p className="c4-chorobates-keys">{v4("chbKeys")} j k / p o u d m c a s v x</p>
      {!shown.length && <p className="c4-pay-empty">{v4("chbEmpty")}</p>}
      <ul className="c4-chorobates-list" data-density={density}>
        {shown.map((card) => {
          const auditKey = AUDIT_KEY[card.audit];
          return (
            <li key={card.id} className="c4-chorobates-card" data-on={focused?.id === card.id ? "1" : "0"} data-staff={card.staff || "blank"} data-late={lateChorobates(card, desk) ? "1" : "0"} data-idle={idleChorobates(card) ? "1" : "0"} data-brisk={briskChorobates(card) ? "1" : "0"} data-resting={restingChorobates(card) ? "1" : "0"} data-overdue={overdueChorobates(card) ? "1" : "0"} data-inner={chorobatesInner(card.staff) ? "1" : "0"} data-outer={chorobatesOuter(card.staff) ? "1" : "0"}>
              <label className="c4-chorobates-pick">
                <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
              </label>
              <div>
                <input className="c4-field" aria-label={v4("chbEdit")} aria-required={false} defaultValue={card.title} disabled={viewer} onBlur={(event) => store(editChorobates(cards, card.id, event.target.value))} />
                <input className="c4-field" aria-label={v4("chbNote")} aria-required={false} defaultValue={card.note} disabled={viewer} onBlur={(event) => store(editChorobatesNote(cards, card.id, event.target.value))} />
                <p className="c4-chorobates-meta">{card.bearer || "—"} · {staffLabel(v4, card.staff)} · {woodLabel(v4, card.wood)} · {card.notch ?? "—"} · {card.vane} · {card.tags.join(" ") || "—"}</p>
                {auditKey && <p className="c4-chorobates-audit">{v4(auditKey)}</p>}
              </div>
              <div className="c4-chorobates-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setChorobatesSighted(cards, card.id, !card.sighted))}>{card.sighted ? v4("chbClear") : v4("chbLay")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setChorobatesWood(cards, card.id, suggested))}>{v4("chbSuggest")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setChorobatesRack(cards, card.id, !card.racked))}>{card.racked ? v4("chbUnrack") : v4("chbRackIt")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setChorobatesVault(cards, card.id, !card.cased))}>{card.cased ? v4("chbUncase") : v4("chbCaseIt")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setChorobatesStar(cards, card.id, !card.starred))}>{card.starred ? v4("chbUnstar") : v4("chbStar")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addChorobatesTag(cards, card.id, "b"))}>{v4("chbTag")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(liftNotchFocused(cards, card.id))}>{v4("chbLift")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerNotchFocused(cards, card.id))}>{v4("chbLower")}</button>
                <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(chorobatesCopy(card))}>{v4("chbCopy")}</button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

type DatumUser = { id?: string; name?: string | null; campaign?: boolean | string | number | null };

export function DatumPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: DatumUser[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<DatumShape>("all");
  const [review, setReview] = useState<DatumReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): DatumRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      datum: { campaign: textField(row.campaign) } satisfies DatumValue,
    };
  }).filter((row): row is DatumRow => Boolean(row));
  const present = presentDatumLanes(rows);
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
    const next = readHiddenDatums(readJson(DTM_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(DTM_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedDatums(readJson(DTM_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(DTM_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleDatumLanes(present, hidden, showHidden);
  const shown = visibleDatums(rows, lanes.includes(lane) || lane === "all" ? lane : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = datumLane(row.datum);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = datumLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingDatum(rows);
  const leadHue = leadingDatumHue(rows);
  const whole = rows.filter((row) => datumLane(row.datum)).length;
  const share = datumShare(laneDatumCount(rows, "house"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("datum-lanes.csv", datumLanesCsv(rows));
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
    writeJson(DTM_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(DTM_REVIEW_KEY, next);
  }

  return (
    <section className="c4-datum" aria-label={v4("dtmTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-datum-mast">
        <p className="c4-datum-seal" data-logo="mono">{v4("dtmLogo")}</p>
        <div>
          <p className="c4-datum-kicker">{v4("dtmSub")}</p>
          <h2 className="c4-title">{v4("dtmTitle")}</h2>
        </div>
        <p className="c4-datum-count">{shown.length}</p>
      </header>
      <p className="c4-datum-links">
        <Link href={crmv4Href(base, "chb")}>{v4("chbTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("dtmCustomer")}</Link>
      </p>
      <p className="c4-datum-hint">{v4("dtmHint")}</p>
      {viewer && <p className="c4-datum-note">{v4("dtmViewer")}</p>}
      <p className="c4-datum-meta">{v4("dtmLead")} {laneLabel(v4, lead)} · {v4("dtmToneLead")} {hueLabel(v4, leadHue)} · {v4("dtmShare")} {share}</p>
      <div className="c4-datum-chart" aria-label={v4("dtmChart")}>
        {lines.map((line) => (
          <button key={line.lane} type="button" className="c4-datum-column" data-on={lane === line.lane ? "1" : "0"} data-lane={line.lane} onClick={() => setLane(lane === line.lane ? "all" : line.lane)}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-datum-tools">
        <input ref={searchRef} className="c4-field c4-datum-search" aria-label={v4("dtmSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("dtmSearch")} />
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("dtmShow")}</button>
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{v4(item === "all" ? "dtmAll" : item === "reviewed" ? "dtmReviewed" : "dtmFresh")}</button>
        ))}
        {(["all", "champagne", "ivory", "graphite"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("dtmAll") : hueLabel(v4, item)}</button>
        ))}
        {(Object.keys(SHAPE_KEY) as DatumShape[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" onClick={() => storeHidden(toggleDatum(hidden, item))}>{hidden.includes(item) ? v4("dtmShow") : v4("dtmHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-datum-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkDatumReview(reviewed, picked, true))}>{v4("dtmBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkDatumReview(reviewed, picked, false))}>{v4("dtmBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("datum-lanes.csv", datumLanesCsv(rows))}>{v4("dtmCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("datum-rows.csv", datumRowsCsv(shown, reviewed))}>{v4("dtmRowCsv")}</button>
      </div>
      {queue.loading && !rows.length && <p className="c4-meta">{v4("dtmLoading")}</p>}
      {queue.error && <p className="c4-meta">{v4("dtmFailed")}</p>}
      {!queue.loading && !queue.error && !rows.length && <p className="c4-pay-empty">{v4("dtmEmpty")}</p>}
      <ul className="c4-datum-list">
        {shown.map((row) => {
          const name = datumCopy(row.datum);
          const tone = datumHue(row.datum);
          return (
            <li key={row.id} className="c4-datum-card" data-lane={datumLane(row.datum) || "open"} data-hue={tone || "none"} data-house={datumHouseSafe(row.datum)} data-open={datumOpen(row.datum) ? "1" : "0"} data-even={datumEven(row.datum) ? "1" : "0"} data-digit={datumDigit(row.datum) ? "1" : "0"} data-letter={datumLetter(row.datum) ? "1" : "0"} data-mixed={datumMixed(row.datum) ? "1" : "0"} data-upper={datumUpper(row.datum) ? "1" : "0"} data-lower={datumLower(row.datum) ? "1" : "0"} data-space={datumSpace(row.datum) ? "1" : "0"} data-vowel={datumVowel(row.datum) ? "1" : "0"} data-tail={datumTail(row.datum) ? "1" : "0"} data-first={datumFirst(row.datum) ? "1" : "0"} data-cased={datumHeld(row.datum) ? "1" : "0"} data-hyphen={datumHyphen(row.datum) ? "1" : "0"} data-period={datumPeriod(row.datum) ? "1" : "0"} data-capital={datumCapital(row.datum) ? "1" : "0"}>
              <label className="c4-datum-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-datum-meta">{name || v4("dtmOpen")} · {datumStamp(row.datum) || "—"} · {datumFamily(row.datum) || "—"} · {datumLength(row.datum) ?? "—"} · {laneLabel(v4, datumLane(row.datum))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-datum-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleDatumReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("dtmReviewed") : v4("dtmReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const text = datumCopy(row.datum); if (!text) return; navigator.clipboard?.writeText(text); setCopied(row.id); }}>{copied === row.id ? v4("dtmCopied") : v4("dtmCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("dtmCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function datumHouseSafe(raw: DatumValue): string {
  return datumLane(raw) === "house" ? "1" : "0";
}
