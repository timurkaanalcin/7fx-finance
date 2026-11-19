"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  SHD_KEY,
  SHD_REVIEW_KEY,
  SCP_STAVES,
  SCP_DENSITY_KEY,
  SCP_KEY,
  SCP_VIEW_KEY,
  addScapheTag,
  addScapheView,
  addScaphe,
  briskScaphe,
  bulkShadeReview,
  bulkScapheVault,
  bulkScapheSighted,
  bulkScapheTag,
  bulkScapheOak,
  busiestBearer,
  dropScapheView,
  editScapheNote,
  editScaphe,
  fairBearer,
  shadeCapital,
  shadeCopy,
  shadeDigit,
  shadeEven,
  shadeFamily,
  shadeFirst,
  shadeHeld,
  shadeHue,
  shadeHyphen,
  shadeLane,
  shadeLanes,
  shadeLanesCsv,
  shadeLength,
  shadeLetter,
  shadeLower,
  shadeMixed,
  shadeOpen,
  shadePeriod,
  shadeRowsCsv,
  shadeShare,
  shadeSpace,
  shadeStamp,
  shadeTail,
  shadeUpper,
  shadeVowel,
  idleScaphe,
  laneShadeCount,
  lateScaphe,
  leadingShade,
  leadingShadeHue,
  liftNotchFocused,
  lowerVaneFocused,
  lowerNotchFocused,
  moveScapheFocus,
  scapheBars,
  scapheCopy,
  scapheCounts,
  scapheCsv,
  scapheDensity,
  scapheInner,
  scapheOuter,
  scapheBearers,
  scapheTimeline,
  overdueScaphe,
  presentShadeLanes,
  raiseVaneFocused,
  readHiddenShades,
  readScapheViews,
  readScapheRules,
  readReviewedShades,
  reminderScapheRules,
  restingScaphe,
  setScapheFocused,
  setScapheVault,
  setScapheSighted,
  setScapheRack,
  setScapheStar,
  setScapheWood,
  sortScapheRules,
  starScapheFocused,
  suggestNotch,
  suggestStaff,
  suggestWood,
  toggleShade,
  toggleShadeReview,
  visibleShadeLanes,
  visibleShades,
  visibleScapheRules,
  woodFocused,
  rackScapheFocused,
  type ShadeReview,
  type ShadeRow,
  type ShadeShape,
  type ShadeValue,
  type ScapheDensity,
  type ScapheSort,
  type ScapheTray,
  type ScapheView,
  type Scaphe,
} from "@/lib/crmv4/round313";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const WOODS = ["MARBLE", "SLATE", "CHALK"] as const;
const NOTCHES = ["6", "9", "12", "15"] as const;
const VANES = ["2", "4", "8"] as const;

const CLIMATE_KEY: Record<string, CrmV4CopyKey> = {
  lip: "scpReed",
  bowl: "scpWand",
  pin: "scpPole",
  well: "scpMast",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "scpAuditSave",
  edit: "scpAuditEdit",
  note: "scpAuditNote",
  wood: "scpAuditWood",
  set: "scpAuditSet",
  clear: "scpAuditClear",
  sheath: "scpAuditRack",
  resume: "scpAuditResume",
  crypt: "scpAuditCase",
  open: "scpAuditOpen",
  tag: "scpAuditTag",
  vane: "scpAuditVane",
  notch: "scpAuditNotch",
  lower: "scpAuditLowerNotch",
  star: "scpAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  house: "shdHouse",
  fort: "shdFort",
  harbor: "shdHarbor",
  digit: "shdDigit",
  spark: "shdSpark",
  scroll: "shdScroll",
  vowel: "shdVowel",
  post: "shdPost",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "shdChampagne",
  ivory: "shdIvory",
  graphite: "shdGraphite",
};

const SHAPE_KEY: Record<ShadeShape, CrmV4CopyKey> = {
  all: "shdShapeAll",
  house: "shdShapeHouse",
  fort: "shdShapeFort",
  harbor: "shdShapeHarbor",
  digit: "shdShapeDigit",
  spark: "shdShapeSpark",
  scroll: "shdShapeScroll",
  vowel: "shdShapeVowel",
  post: "shdShapePost",
  open: "shdShapeOpen",
  soon: "shdShapeSoon",
  letter: "shdShapeLetter",
  mixed: "shdShapeMixed",
  upper: "shdShapeUpper",
  lower: "shdShapeLower",
  space: "shdShapeSpace",
  even: "shdShapeEven",
  odd: "shdShapeOdd",
  tail: "shdShapeTail",
  first: "shdShapeFirst",
  cased: "shdShapeHeld",
  hyphen: "shdShapeHyphen",
  period: "shdShapePeriod",
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
  return key ? v4(key) : v4("scpBlankBoard");
}

function woodLabel(v4: V4, wood: string): string {
  if (wood === "MARBLE") return v4("scpLime");
  if (wood === "SLATE") return v4("scpYew");
  if (wood === "CHALK") return v4("scpOak");
  return v4("scpAll");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("shdUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("shdUnmarked");
}

export function ScapheRules({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Scaphe[]>([]);
  const [views, setViews] = useState<ScapheView[]>([]);
  const [density, setDensity] = useState<ScapheDensity>("broad");
  const [tray, setTray] = useState<ScapheTray>("yard");
  const [query, setQuery] = useState("");
  const [bearerFilter, setBearerFilter] = useState("");
  const [woodFilter, setWoodFilter] = useState("all");
  const [staffFilter, setStaffFilter] = useState("all");
  const [notchFilter, setNotchFilter] = useState("all");
  const [vaneFilter, setVaneFilter] = useState("all");
  const [sort, setSort] = useState<ScapheSort>("staff");
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
  const [desk, setDesk] = useState("lip");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readScapheRules(readJson(SCP_KEY, [])));
    setViews(readScapheViews(readJson(SCP_VIEW_KEY, [])));
    setDensity(scapheDensity(readJson(SCP_DENSITY_KEY, "broad")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Scaphe[]) {
    setCards(next);
    writeJson(SCP_KEY, next);
  }
  function storeViews(next: ScapheView[]) {
    setViews(next);
    writeJson(SCP_VIEW_KEY, next);
  }
  function storeDensity(next: ScapheDensity) {
    setDensity(next);
    writeJson(SCP_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortScapheRules(visibleScapheRules(cards, tray, query, bearerFilter, woodFilter, staffFilter, notchFilter, vaneFilter), sort),
    [cards, tray, query, bearerFilter, woodFilter, staffFilter, notchFilter, vaneFilter, sort],
  );
  const counts = scapheCounts(cards, shown, desk);
  const bars = scapheBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = scapheTimeline(cards);
  const bearers = scapheBearers(cards);
  const suggested = suggestWood(cards);
  const fair = fairBearer(cards, bearers.join(","));
  const busy = busiestBearer(cards);
  const reminders = reminderScapheRules(cards);
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
        setFocusAt((index) => moveScapheFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocusAt((index) => moveScapheFocus(index, shown.length, -1));
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
        store(setScapheVault(cards, id, !shown[focusAt]?.cased));
        return;
      }
      if (event.key === "m" || event.key === "M") {
        event.preventDefault();
        store(woodFocused(cards, id));
        return;
      }
      if (event.key === "c" || event.key === "C") {
        event.preventDefault();
        store(rackScapheFocused(cards, id));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        store(setScapheFocused(cards, id));
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("scaphe-rules.csv", scapheCsv(shown, desk));
        return;
      }
      if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        store(starScapheFocused(cards, id));
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
    <section className="c4-scaphe" aria-label={v4("scpTitle")} data-cards="1" data-desk={tray} data-names="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-scaphe-mast">
        <p className="c4-scaphe-seal" data-logo="mono">{v4("scpLogo")}</p>
        <div>
          <p className="c4-scaphe-kicker">{v4("scpSub")}</p>
          <h2 className="c4-title">{v4("scpTitle")}</h2>
        </div>
        <p className="c4-scaphe-count">{counts.matched}</p>
      </header>
      <ol className="c4-scaphe-index" aria-label={v4("scpTitle")}>
        <li data-tone="gold">{v4("scpBoard")} {counts.court}</li>
        <li data-tone="ink">{v4("scpOverdue")} {counts.overdue}</li>
        <li data-tone="ivory">{v4("scpHouse")} {counts.house}</li>
      </ol>
      <p className="c4-scaphe-links">
        <Link href={crmv4Href(base, "shd")}>{v4("shdTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("scpCustomers")}</Link>
      </p>
      <p className="c4-scaphe-hint">{v4("scpHint")}</p>
      {viewer && <p className="c4-scaphe-note">{v4("scpViewer")}</p>}
      {counts.overdue > 0 && <p className="c4-scaphe-notice" role="status">{v4("scpOverdue")} {counts.overdue}</p>}
      <ol className="c4-scaphe-dials" aria-label={v4("scpChart")}>
        <li>{v4("scpBoard")} {counts.court}</li>
        <li>{v4("scpRack")} {counts.rack}</li>
        <li>{v4("scpCase")} {counts.vault}</li>
        <li>{v4("scpInner")} {counts.inner}</li>
        <li>{v4("scpOuter")} {counts.outer}</li>
        <li>{v4("scpWide")} {counts.wide}</li>
        <li>{v4("scpStar")} {counts.starred}</li>
        <li>{v4("scpIdle")} {counts.idle}</li>
        <li>{v4("scpBrisk")} {counts.brisk}</li>
        <li>{v4("scpResting")} {counts.resting}</li>
      </ol>
      <div className="c4-scaphe-chart" aria-label={v4("scpChart")}>
        {bars.map((bar) => (
          <button key={bar.staff} type="button" className="c4-scaphe-column" data-on={staffFilter === bar.staff ? "1" : "0"} data-staff={bar.staff} onClick={() => setStaffFilter(staffFilter === bar.staff ? "all" : bar.staff)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{staffLabel(v4, bar.staff)}</span>
          </button>
        ))}
      </div>
      <div className="c4-scaphe-tools">
        <input ref={searchRef} className="c4-field c4-scaphe-search" aria-label={v4("scpSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("scpSearch")} />
        {(["yard", "rack", "case"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "yard" ? "scpBoard" : item === "rack" ? "scpRack" : "scpCase")}</button>
        ))}
        {(["all", "inner", "outer", ...SCP_STAVES] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={staffFilter === item ? "1" : "0"} onClick={() => setStaffFilter(item)}>{item === "all" ? v4("scpAll") : item === "inner" ? v4("scpInner") : item === "outer" ? v4("scpOuter") : staffLabel(v4, item)}</button>
        ))}
        {(["all", ...WOODS] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={woodFilter === item ? "1" : "0"} onClick={() => setWoodFilter(item)}>{item === "all" ? v4("scpAll") : woodLabel(v4, item)}</button>
        ))}
        {(["all", ...NOTCHES] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={notchFilter === item ? "1" : "0"} onClick={() => setNotchFilter(item)}>{item === "all" ? v4("scpNotch") : item}</button>
        ))}
        {(["all", ...VANES] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={vaneFilter === item ? "1" : "0"} onClick={() => setVaneFilter(item)}>{item === "all" ? v4("scpVane") : item}</button>
        ))}
        <button type="button" className="c4-chip" data-on={sort === "staff" ? "1" : "0"} onClick={() => setSort("staff")}>{v4("scpSortBoard")}</button>
        <button type="button" className="c4-chip" data-on={sort === "bearer" ? "1" : "0"} onClick={() => setSort("bearer")}>{v4("scpSortBearer")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "broad" : "tight")}>{density === "tight" ? v4("scpTight") : v4("scpBroad")}</button>
        {SCP_STAVES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={desk === item ? "1" : "0"} onClick={() => setDesk(item)}>{v4("scpDesk")} {staffLabel(v4, item)}</button>
        ))}
        {bearers.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={bearerFilter === name ? "1" : "0"} onClick={() => setBearerFilter(bearerFilter === name ? "" : name)}>{name}</button>
        ))}
      </div>
      <p className="c4-scaphe-meta">{v4("scpSuggest")} {woodLabel(v4, suggested)} · {notchHint} · {staffLabel(v4, staffHint)} · {v4("scpFair")} {fair || "—"} · {v4("scpBusy")} {busy || "—"}</p>
      {reminders.length > 0 && (
        <ul className="c4-scaphe-remind" aria-label={v4("scpRemind")}>
          {reminders.map((item) => <li key={item}>{item}</li>)}
        </ul>
      )}
      {timeline.length > 0 && (
        <ol className="c4-scaphe-time" aria-label={v4("scpTimeline")}>
          {timeline.map((lane) => <li key={lane.notch}>{lane.notch} · {lane.titles.join(" · ")}</li>)}
        </ol>
      )}
      <form className="c4-scaphe-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addScaphe(cards, { title, note, bearer, staff, wood, notch: notchNo, vane: vaneNo, tags });
        if (next.length === cards.length) return;
        store(next);
        setTitle("");
        setNote("");
        setTags("");
      }}>
        <input className="c4-field" aria-label={v4("scpEdit")} aria-required={false} value={title} onChange={(event) => setTitle(event.target.value)} placeholder={v4("scpEdit")} disabled={viewer} />
        <input className="c4-field" aria-label={v4("scpNote")} aria-required={false} value={note} onChange={(event) => setNote(event.target.value)} placeholder={v4("scpNote")} disabled={viewer} />
        <input className="c4-field" aria-label={v4("scpBearer")} aria-required={false} value={bearer} onChange={(event) => setBearer(event.target.value)} placeholder={v4("scpBearer")} disabled={viewer} />
        <select className="c4-select" aria-label={v4("scpDesk")} value={staff} onChange={(event) => setStaff(event.target.value)} disabled={viewer}>
          <option value="">{v4("scpBlankBoard")}</option>
          {SCP_STAVES.map((item) => <option key={item} value={item}>{staffLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("scpWood")} value={wood} onChange={(event) => setWood(event.target.value)} disabled={viewer}>
          <option value="">{v4("scpWood")}</option>
          {WOODS.map((item) => <option key={item} value={item}>{woodLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("scpNotch")} value={notchNo} onChange={(event) => setNotchNo(event.target.value)} disabled={viewer}>
          <option value="">{v4("scpNotch")}</option>
          {NOTCHES.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("scpVane")} value={vaneNo} onChange={(event) => setVaneNo(event.target.value)} disabled={viewer}>
          <option value="">{v4("scpVane")}</option>
          {VANES.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <input className="c4-field" aria-label={v4("scpTag")} aria-required={false} value={tags} onChange={(event) => setTags(event.target.value)} placeholder={v4("scpTag")} disabled={viewer} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("scpAdd")}</button>
      </form>
      <form className="c4-scaphe-views" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addScapheView(views, { id: `v${Date.now().toString(36)}`, name: viewName, tray, query, bearer: bearerFilter, wood: woodFilter, staff: staffFilter, notch: notchFilter, vane: vaneFilter });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <input className="c4-field" aria-label={v4("scpViewName")} aria-required={false} value={viewName} onChange={(event) => setViewName(event.target.value)} placeholder={v4("scpViewName")} disabled={viewer} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("scpSaveView")}</button>
        {views.map((view) => (
          <span key={view.id} className="c4-scaphe-view">
            <button type="button" className="c4-chip" onClick={() => { setTray(view.tray); setQuery(view.query); setBearerFilter(view.bearer); setWoodFilter(view.wood); setStaffFilter(view.staff); setNotchFilter(view.notch); setVaneFilter(view.vane); }}>{v4("scpApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropScapheView(views, view.id))}>{v4("scpDrop")}</button>
          </span>
        ))}
      </form>
      <div className="c4-scaphe-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkScapheSighted(cards, picked))}>{v4("scpBulkLaid")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkScapheOak(cards, picked))}>{v4("scpBulkOak")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkScapheVault(cards, picked))}>{v4("scpBulkCrypt")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkScapheTag(cards, picked))}>{v4("scpBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("scaphe-rules.csv", scapheCsv(shown, desk))}>{v4("scpCsv")}</button>
      </div>
      <p className="c4-scaphe-keys">{v4("scpKeys")} j k / p o u d m c a s v x</p>
      {!shown.length && <p className="c4-pay-empty">{v4("scpEmpty")}</p>}
      <ul className="c4-scaphe-list" data-density={density}>
        {shown.map((card) => {
          const auditKey = AUDIT_KEY[card.audit];
          return (
            <li key={card.id} className="c4-scaphe-card" data-on={focused?.id === card.id ? "1" : "0"} data-staff={card.staff || "blank"} data-late={lateScaphe(card, desk) ? "1" : "0"} data-idle={idleScaphe(card) ? "1" : "0"} data-brisk={briskScaphe(card) ? "1" : "0"} data-resting={restingScaphe(card) ? "1" : "0"} data-overdue={overdueScaphe(card) ? "1" : "0"} data-inner={scapheInner(card.staff) ? "1" : "0"} data-outer={scapheOuter(card.staff) ? "1" : "0"}>
              <label className="c4-scaphe-pick">
                <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
              </label>
              <div>
                <input className="c4-field" aria-label={v4("scpEdit")} aria-required={false} defaultValue={card.title} disabled={viewer} onBlur={(event) => store(editScaphe(cards, card.id, event.target.value))} />
                <input className="c4-field" aria-label={v4("scpNote")} aria-required={false} defaultValue={card.note} disabled={viewer} onBlur={(event) => store(editScapheNote(cards, card.id, event.target.value))} />
                <p className="c4-scaphe-meta">{card.bearer || "—"} · {staffLabel(v4, card.staff)} · {woodLabel(v4, card.wood)} · {card.notch ?? "—"} · {card.vane} · {card.tags.join(" ") || "—"}</p>
                {auditKey && <p className="c4-scaphe-audit">{v4(auditKey)}</p>}
              </div>
              <div className="c4-scaphe-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setScapheSighted(cards, card.id, !card.sighted))}>{card.sighted ? v4("scpClear") : v4("scpLay")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setScapheWood(cards, card.id, suggested))}>{v4("scpSuggest")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setScapheRack(cards, card.id, !card.racked))}>{card.racked ? v4("scpUnrack") : v4("scpRackIt")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setScapheVault(cards, card.id, !card.cased))}>{card.cased ? v4("scpUncase") : v4("scpCaseIt")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setScapheStar(cards, card.id, !card.starred))}>{card.starred ? v4("scpUnstar") : v4("scpStar")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addScapheTag(cards, card.id, "c"))}>{v4("scpTag")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(liftNotchFocused(cards, card.id))}>{v4("scpLift")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerNotchFocused(cards, card.id))}>{v4("scpLower")}</button>
                <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(scapheCopy(card))}>{v4("scpCopy")}</button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

type ShadeUser = { id?: string; name?: string | null; deskId?: boolean | string | number | null };

export function ShadePlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: ShadeUser[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<ShadeShape>("all");
  const [review, setReview] = useState<ShadeReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): ShadeRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      shade: { deskId: textField(row.deskId) } satisfies ShadeValue,
    };
  }).filter((row): row is ShadeRow => Boolean(row));
  const present = presentShadeLanes(rows);
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
    const next = readHiddenShades(readJson(SHD_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(SHD_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedShades(readJson(SHD_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(SHD_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleShadeLanes(present, hidden, showHidden);
  const shown = visibleShades(rows, lanes.includes(lane) || lane === "all" ? lane : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = shadeLane(row.shade);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = shadeLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingShade(rows);
  const leadHue = leadingShadeHue(rows);
  const whole = rows.filter((row) => shadeLane(row.shade)).length;
  const share = shadeShare(laneShadeCount(rows, "house"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("shade-lanes.csv", shadeLanesCsv(rows));
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
    writeJson(SHD_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(SHD_REVIEW_KEY, next);
  }

  return (
    <section className="c4-shade" aria-label={v4("shdTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-shade-mast">
        <p className="c4-shade-seal" data-logo="mono">{v4("shdLogo")}</p>
        <div>
          <p className="c4-shade-kicker">{v4("shdSub")}</p>
          <h2 className="c4-title">{v4("shdTitle")}</h2>
        </div>
        <p className="c4-shade-count">{shown.length}</p>
      </header>
      <p className="c4-shade-links">
        <Link href={crmv4Href(base, "scp")}>{v4("scpTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("shdCustomer")}</Link>
      </p>
      <p className="c4-shade-hint">{v4("shdHint")}</p>
      {viewer && <p className="c4-shade-note">{v4("shdViewer")}</p>}
      <p className="c4-shade-meta">{v4("shdLead")} {laneLabel(v4, lead)} · {v4("shdToneLead")} {hueLabel(v4, leadHue)} · {v4("shdShare")} {share}</p>
      <div className="c4-shade-chart" aria-label={v4("shdChart")}>
        {lines.map((line) => (
          <button key={line.lane} type="button" className="c4-shade-column" data-on={lane === line.lane ? "1" : "0"} data-lane={line.lane} onClick={() => setLane(lane === line.lane ? "all" : line.lane)}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-shade-tools">
        <input ref={searchRef} className="c4-field c4-shade-search" aria-label={v4("shdSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("shdSearch")} />
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("shdShow")}</button>
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{v4(item === "all" ? "shdAll" : item === "reviewed" ? "shdReviewed" : "shdFresh")}</button>
        ))}
        {(["all", "champagne", "ivory", "graphite"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("shdAll") : hueLabel(v4, item)}</button>
        ))}
        {(Object.keys(SHAPE_KEY) as ShadeShape[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" onClick={() => storeHidden(toggleShade(hidden, item))}>{hidden.includes(item) ? v4("shdShow") : v4("shdHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-shade-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkShadeReview(reviewed, picked, true))}>{v4("shdBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkShadeReview(reviewed, picked, false))}>{v4("shdBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("shade-lanes.csv", shadeLanesCsv(rows))}>{v4("shdCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("shade-rows.csv", shadeRowsCsv(shown, reviewed))}>{v4("shdRowCsv")}</button>
      </div>
      {queue.loading && !rows.length && <p className="c4-meta">{v4("shdLoading")}</p>}
      {queue.error && <p className="c4-meta">{v4("shdFailed")}</p>}
      {!queue.loading && !queue.error && !rows.length && <p className="c4-pay-empty">{v4("shdEmpty")}</p>}
      <ul className="c4-shade-list">
        {shown.map((row) => {
          const name = shadeCopy(row.shade);
          const tone = shadeHue(row.shade);
          return (
            <li key={row.id} className="c4-shade-card" data-lane={shadeLane(row.shade) || "open"} data-hue={tone || "none"} data-house={shadeHouseSafe(row.shade)} data-open={shadeOpen(row.shade) ? "1" : "0"} data-even={shadeEven(row.shade) ? "1" : "0"} data-digit={shadeDigit(row.shade) ? "1" : "0"} data-letter={shadeLetter(row.shade) ? "1" : "0"} data-mixed={shadeMixed(row.shade) ? "1" : "0"} data-upper={shadeUpper(row.shade) ? "1" : "0"} data-lower={shadeLower(row.shade) ? "1" : "0"} data-space={shadeSpace(row.shade) ? "1" : "0"} data-vowel={shadeVowel(row.shade) ? "1" : "0"} data-tail={shadeTail(row.shade) ? "1" : "0"} data-first={shadeFirst(row.shade) ? "1" : "0"} data-cased={shadeHeld(row.shade) ? "1" : "0"} data-hyphen={shadeHyphen(row.shade) ? "1" : "0"} data-period={shadePeriod(row.shade) ? "1" : "0"} data-capital={shadeCapital(row.shade) ? "1" : "0"}>
              <label className="c4-shade-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-shade-meta">{name || v4("shdOpen")} · {shadeStamp(row.shade) || "—"} · {shadeFamily(row.shade) || "—"} · {shadeLength(row.shade) ?? "—"} · {laneLabel(v4, shadeLane(row.shade))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-shade-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleShadeReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("shdReviewed") : v4("shdReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const text = shadeCopy(row.shade); if (!text) return; navigator.clipboard?.writeText(text); setCopied(row.id); }}>{copied === row.id ? v4("shdCopied") : v4("shdCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("shdCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function shadeHouseSafe(raw: ShadeValue): string {
  return shadeLane(raw) === "house" ? "1" : "0";
}
