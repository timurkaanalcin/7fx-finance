"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  AZM_KEY,
  AZM_REVIEW_KEY,
  BCL_STAVES,
  BCL_DENSITY_KEY,
  BCL_KEY,
  BCL_VIEW_KEY,
  addBaculusTag,
  addBaculusView,
  addBaculus,
  briskBaculus,
  bulkAzimuthReview,
  bulkBaculusVault,
  bulkBaculusSighted,
  bulkBaculusTag,
  bulkBaculusOak,
  busiestBearer,
  dropBaculusView,
  editBaculusNote,
  editBaculus,
  fairBearer,
  azimuthCapital,
  azimuthCopy,
  azimuthDigit,
  azimuthEven,
  azimuthFamily,
  azimuthFirst,
  azimuthHeld,
  azimuthHue,
  azimuthHyphen,
  azimuthLane,
  azimuthLanes,
  azimuthLanesCsv,
  azimuthLength,
  azimuthLetter,
  azimuthLower,
  azimuthMixed,
  azimuthOpen,
  azimuthPeriod,
  azimuthRowsCsv,
  azimuthShare,
  azimuthSpace,
  azimuthStamp,
  azimuthTail,
  azimuthUpper,
  azimuthVowel,
  idleBaculus,
  laneAzimuthCount,
  lateBaculus,
  leadingAzimuth,
  leadingAzimuthHue,
  liftNotchFocused,
  lowerVaneFocused,
  lowerNotchFocused,
  moveBaculusFocus,
  baculusBars,
  baculusCopy,
  baculusCounts,
  baculusCsv,
  baculusDensity,
  baculusInner,
  baculusOuter,
  baculusBearers,
  baculusTimeline,
  overdueBaculus,
  presentAzimuthLanes,
  raiseVaneFocused,
  readHiddenAzimuths,
  readBaculusViews,
  readBaculusRules,
  readReviewedAzimuths,
  reminderBaculusRules,
  restingBaculus,
  setBaculusFocused,
  setBaculusVault,
  setBaculusSighted,
  setBaculusRack,
  setBaculusStar,
  setBaculusWood,
  sortBaculusRules,
  starBaculusFocused,
  suggestNotch,
  suggestStaff,
  suggestWood,
  toggleAzimuth,
  toggleAzimuthReview,
  visibleAzimuthLanes,
  visibleAzimuths,
  visibleBaculusRules,
  woodFocused,
  rackBaculusFocused,
  type AzimuthReview,
  type AzimuthRow,
  type AzimuthShape,
  type AzimuthValue,
  type BaculusDensity,
  type BaculusSort,
  type BaculusTray,
  type BaculusView,
  type Baculus,
} from "@/lib/crmv4/round309";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const WOODS = ["LIME", "YEW", "OAK"] as const;
const NOTCHES = ["3", "6", "12", "24"] as const;
const VANES = ["2", "4", "9"] as const;

const CLIMATE_KEY: Record<string, CrmV4CopyKey> = {
  reed: "bclReed",
  wand: "bclWand",
  pole: "bclPole",
  mast: "bclMast",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "bclAuditSave",
  edit: "bclAuditEdit",
  note: "bclAuditNote",
  wood: "bclAuditWood",
  set: "bclAuditSet",
  clear: "bclAuditClear",
  sheath: "bclAuditRack",
  resume: "bclAuditResume",
  crypt: "bclAuditCase",
  open: "bclAuditOpen",
  tag: "bclAuditTag",
  vane: "bclAuditVane",
  notch: "bclAuditNotch",
  lower: "bclAuditLowerNotch",
  star: "bclAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  house: "azmHouse",
  fort: "azmFort",
  harbor: "azmHarbor",
  digit: "azmDigit",
  spark: "azmSpark",
  scroll: "azmScroll",
  vowel: "azmVowel",
  post: "azmPost",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "azmChampagne",
  ivory: "azmIvory",
  graphite: "azmGraphite",
};

const SHAPE_KEY: Record<AzimuthShape, CrmV4CopyKey> = {
  all: "azmShapeAll",
  house: "azmShapeHouse",
  fort: "azmShapeFort",
  harbor: "azmShapeHarbor",
  digit: "azmShapeDigit",
  spark: "azmShapeSpark",
  scroll: "azmShapeScroll",
  vowel: "azmShapeVowel",
  post: "azmShapePost",
  open: "azmShapeOpen",
  soon: "azmShapeSoon",
  letter: "azmShapeLetter",
  mixed: "azmShapeMixed",
  upper: "azmShapeUpper",
  lower: "azmShapeLower",
  space: "azmShapeSpace",
  even: "azmShapeEven",
  odd: "azmShapeOdd",
  tail: "azmShapeTail",
  first: "azmShapeFirst",
  cased: "azmShapeHeld",
  hyphen: "azmShapeHyphen",
  period: "azmShapePeriod",
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
  return key ? v4(key) : v4("bclBlankBoard");
}

function woodLabel(v4: V4, wood: string): string {
  if (wood === "LIME") return v4("bclLime");
  if (wood === "YEW") return v4("bclYew");
  if (wood === "OAK") return v4("bclOak");
  return v4("bclAll");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("azmUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("azmUnmarked");
}

export function BaculusRules({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Baculus[]>([]);
  const [views, setViews] = useState<BaculusView[]>([]);
  const [density, setDensity] = useState<BaculusDensity>("broad");
  const [tray, setTray] = useState<BaculusTray>("yard");
  const [query, setQuery] = useState("");
  const [bearerFilter, setBearerFilter] = useState("");
  const [woodFilter, setWoodFilter] = useState("all");
  const [staffFilter, setStaffFilter] = useState("all");
  const [notchFilter, setNotchFilter] = useState("all");
  const [vaneFilter, setVaneFilter] = useState("all");
  const [sort, setSort] = useState<BaculusSort>("staff");
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
  const [desk, setDesk] = useState("reed");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readBaculusRules(readJson(BCL_KEY, [])));
    setViews(readBaculusViews(readJson(BCL_VIEW_KEY, [])));
    setDensity(baculusDensity(readJson(BCL_DENSITY_KEY, "broad")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Baculus[]) {
    setCards(next);
    writeJson(BCL_KEY, next);
  }
  function storeViews(next: BaculusView[]) {
    setViews(next);
    writeJson(BCL_VIEW_KEY, next);
  }
  function storeDensity(next: BaculusDensity) {
    setDensity(next);
    writeJson(BCL_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortBaculusRules(visibleBaculusRules(cards, tray, query, bearerFilter, woodFilter, staffFilter, notchFilter, vaneFilter), sort),
    [cards, tray, query, bearerFilter, woodFilter, staffFilter, notchFilter, vaneFilter, sort],
  );
  const counts = baculusCounts(cards, shown, desk);
  const bars = baculusBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = baculusTimeline(cards);
  const bearers = baculusBearers(cards);
  const suggested = suggestWood(cards);
  const fair = fairBearer(cards, bearers.join(","));
  const busy = busiestBearer(cards);
  const reminders = reminderBaculusRules(cards);
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
        setFocusAt((index) => moveBaculusFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocusAt((index) => moveBaculusFocus(index, shown.length, -1));
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
        store(setBaculusVault(cards, id, !shown[focusAt]?.cased));
        return;
      }
      if (event.key === "m" || event.key === "M") {
        event.preventDefault();
        store(woodFocused(cards, id));
        return;
      }
      if (event.key === "c" || event.key === "C") {
        event.preventDefault();
        store(rackBaculusFocused(cards, id));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        store(setBaculusFocused(cards, id));
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("baculus-rules.csv", baculusCsv(shown, desk));
        return;
      }
      if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        store(starBaculusFocused(cards, id));
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
    <section className="c4-baculus" aria-label={v4("bclTitle")} data-cards="1" data-desk={tray} data-names="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-baculus-mast">
        <p className="c4-baculus-seal" data-logo="mono">{v4("bclLogo")}</p>
        <div>
          <p className="c4-baculus-kicker">{v4("bclSub")}</p>
          <h2 className="c4-title">{v4("bclTitle")}</h2>
        </div>
        <p className="c4-baculus-count">{counts.matched}</p>
      </header>
      <ol className="c4-baculus-index" aria-label={v4("bclTitle")}>
        <li data-tone="gold">{v4("bclBoard")} {counts.court}</li>
        <li data-tone="ink">{v4("bclOverdue")} {counts.overdue}</li>
        <li data-tone="ivory">{v4("bclHouse")} {counts.house}</li>
      </ol>
      <p className="c4-baculus-links">
        <Link href={crmv4Href(base, "azm")}>{v4("azmTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("bclCustomers")}</Link>
      </p>
      <p className="c4-baculus-hint">{v4("bclHint")}</p>
      {viewer && <p className="c4-baculus-note">{v4("bclViewer")}</p>}
      {counts.overdue > 0 && <p className="c4-baculus-notice" role="status">{v4("bclOverdue")} {counts.overdue}</p>}
      <ol className="c4-baculus-dials" aria-label={v4("bclChart")}>
        <li>{v4("bclBoard")} {counts.court}</li>
        <li>{v4("bclRack")} {counts.rack}</li>
        <li>{v4("bclCase")} {counts.vault}</li>
        <li>{v4("bclInner")} {counts.inner}</li>
        <li>{v4("bclOuter")} {counts.outer}</li>
        <li>{v4("bclWide")} {counts.wide}</li>
        <li>{v4("bclStar")} {counts.starred}</li>
        <li>{v4("bclIdle")} {counts.idle}</li>
        <li>{v4("bclBrisk")} {counts.brisk}</li>
        <li>{v4("bclResting")} {counts.resting}</li>
      </ol>
      <div className="c4-baculus-chart" aria-label={v4("bclChart")}>
        {bars.map((bar) => (
          <button key={bar.staff} type="button" className="c4-baculus-column" data-on={staffFilter === bar.staff ? "1" : "0"} data-staff={bar.staff} onClick={() => setStaffFilter(staffFilter === bar.staff ? "all" : bar.staff)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{staffLabel(v4, bar.staff)}</span>
          </button>
        ))}
      </div>
      <div className="c4-baculus-tools">
        <input ref={searchRef} className="c4-field c4-baculus-search" aria-label={v4("bclSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("bclSearch")} />
        {(["yard", "rack", "case"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "yard" ? "bclBoard" : item === "rack" ? "bclRack" : "bclCase")}</button>
        ))}
        {(["all", "inner", "outer", ...BCL_STAVES] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={staffFilter === item ? "1" : "0"} onClick={() => setStaffFilter(item)}>{item === "all" ? v4("bclAll") : item === "inner" ? v4("bclInner") : item === "outer" ? v4("bclOuter") : staffLabel(v4, item)}</button>
        ))}
        {(["all", ...WOODS] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={woodFilter === item ? "1" : "0"} onClick={() => setWoodFilter(item)}>{item === "all" ? v4("bclAll") : woodLabel(v4, item)}</button>
        ))}
        {(["all", ...NOTCHES] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={notchFilter === item ? "1" : "0"} onClick={() => setNotchFilter(item)}>{item === "all" ? v4("bclNotch") : item}</button>
        ))}
        {(["all", ...VANES] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={vaneFilter === item ? "1" : "0"} onClick={() => setVaneFilter(item)}>{item === "all" ? v4("bclVane") : item}</button>
        ))}
        <button type="button" className="c4-chip" data-on={sort === "staff" ? "1" : "0"} onClick={() => setSort("staff")}>{v4("bclSortBoard")}</button>
        <button type="button" className="c4-chip" data-on={sort === "bearer" ? "1" : "0"} onClick={() => setSort("bearer")}>{v4("bclSortBearer")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "broad" : "tight")}>{density === "tight" ? v4("bclTight") : v4("bclBroad")}</button>
        {BCL_STAVES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={desk === item ? "1" : "0"} onClick={() => setDesk(item)}>{v4("bclDesk")} {staffLabel(v4, item)}</button>
        ))}
        {bearers.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={bearerFilter === name ? "1" : "0"} onClick={() => setBearerFilter(bearerFilter === name ? "" : name)}>{name}</button>
        ))}
      </div>
      <p className="c4-baculus-meta">{v4("bclSuggest")} {woodLabel(v4, suggested)} · {notchHint} · {staffLabel(v4, staffHint)} · {v4("bclFair")} {fair || "—"} · {v4("bclBusy")} {busy || "—"}</p>
      {reminders.length > 0 && (
        <ul className="c4-baculus-remind" aria-label={v4("bclRemind")}>
          {reminders.map((item) => <li key={item}>{item}</li>)}
        </ul>
      )}
      {timeline.length > 0 && (
        <ol className="c4-baculus-time" aria-label={v4("bclTimeline")}>
          {timeline.map((lane) => <li key={lane.notch}>{lane.notch} · {lane.titles.join(" · ")}</li>)}
        </ol>
      )}
      <form className="c4-baculus-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addBaculus(cards, { title, note, bearer, staff, wood, notch: notchNo, vane: vaneNo, tags });
        if (next.length === cards.length) return;
        store(next);
        setTitle("");
        setNote("");
        setTags("");
      }}>
        <input className="c4-field" aria-label={v4("bclEdit")} aria-required={false} value={title} onChange={(event) => setTitle(event.target.value)} placeholder={v4("bclEdit")} disabled={viewer} />
        <input className="c4-field" aria-label={v4("bclNote")} aria-required={false} value={note} onChange={(event) => setNote(event.target.value)} placeholder={v4("bclNote")} disabled={viewer} />
        <input className="c4-field" aria-label={v4("bclBearer")} aria-required={false} value={bearer} onChange={(event) => setBearer(event.target.value)} placeholder={v4("bclBearer")} disabled={viewer} />
        <select className="c4-select" aria-label={v4("bclDesk")} value={staff} onChange={(event) => setStaff(event.target.value)} disabled={viewer}>
          <option value="">{v4("bclBlankBoard")}</option>
          {BCL_STAVES.map((item) => <option key={item} value={item}>{staffLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("bclWood")} value={wood} onChange={(event) => setWood(event.target.value)} disabled={viewer}>
          <option value="">{v4("bclWood")}</option>
          {WOODS.map((item) => <option key={item} value={item}>{woodLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("bclNotch")} value={notchNo} onChange={(event) => setNotchNo(event.target.value)} disabled={viewer}>
          <option value="">{v4("bclNotch")}</option>
          {NOTCHES.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("bclVane")} value={vaneNo} onChange={(event) => setVaneNo(event.target.value)} disabled={viewer}>
          <option value="">{v4("bclVane")}</option>
          {VANES.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <input className="c4-field" aria-label={v4("bclTag")} aria-required={false} value={tags} onChange={(event) => setTags(event.target.value)} placeholder={v4("bclTag")} disabled={viewer} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("bclAdd")}</button>
      </form>
      <form className="c4-baculus-views" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addBaculusView(views, { id: `v${Date.now().toString(36)}`, name: viewName, tray, query, bearer: bearerFilter, wood: woodFilter, staff: staffFilter, notch: notchFilter, vane: vaneFilter });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <input className="c4-field" aria-label={v4("bclViewName")} aria-required={false} value={viewName} onChange={(event) => setViewName(event.target.value)} placeholder={v4("bclViewName")} disabled={viewer} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("bclSaveView")}</button>
        {views.map((view) => (
          <span key={view.id} className="c4-baculus-view">
            <button type="button" className="c4-chip" onClick={() => { setTray(view.tray); setQuery(view.query); setBearerFilter(view.bearer); setWoodFilter(view.wood); setStaffFilter(view.staff); setNotchFilter(view.notch); setVaneFilter(view.vane); }}>{v4("bclApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropBaculusView(views, view.id))}>{v4("bclDrop")}</button>
          </span>
        ))}
      </form>
      <div className="c4-baculus-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkBaculusSighted(cards, picked))}>{v4("bclBulkLaid")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkBaculusOak(cards, picked))}>{v4("bclBulkOak")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkBaculusVault(cards, picked))}>{v4("bclBulkCrypt")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkBaculusTag(cards, picked))}>{v4("bclBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("baculus-rules.csv", baculusCsv(shown, desk))}>{v4("bclCsv")}</button>
      </div>
      <p className="c4-baculus-keys">{v4("bclKeys")} j k / p o u d m c a s v x</p>
      {!shown.length && <p className="c4-pay-empty">{v4("bclEmpty")}</p>}
      <ul className="c4-baculus-list" data-density={density}>
        {shown.map((card) => {
          const auditKey = AUDIT_KEY[card.audit];
          return (
            <li key={card.id} className="c4-baculus-card" data-on={focused?.id === card.id ? "1" : "0"} data-staff={card.staff || "blank"} data-late={lateBaculus(card, desk) ? "1" : "0"} data-idle={idleBaculus(card) ? "1" : "0"} data-brisk={briskBaculus(card) ? "1" : "0"} data-resting={restingBaculus(card) ? "1" : "0"} data-overdue={overdueBaculus(card) ? "1" : "0"} data-inner={baculusInner(card.staff) ? "1" : "0"} data-outer={baculusOuter(card.staff) ? "1" : "0"}>
              <label className="c4-baculus-pick">
                <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
              </label>
              <div>
                <input className="c4-field" aria-label={v4("bclEdit")} aria-required={false} defaultValue={card.title} disabled={viewer} onBlur={(event) => store(editBaculus(cards, card.id, event.target.value))} />
                <input className="c4-field" aria-label={v4("bclNote")} aria-required={false} defaultValue={card.note} disabled={viewer} onBlur={(event) => store(editBaculusNote(cards, card.id, event.target.value))} />
                <p className="c4-baculus-meta">{card.bearer || "—"} · {staffLabel(v4, card.staff)} · {woodLabel(v4, card.wood)} · {card.notch ?? "—"} · {card.vane} · {card.tags.join(" ") || "—"}</p>
                {auditKey && <p className="c4-baculus-audit">{v4(auditKey)}</p>}
              </div>
              <div className="c4-baculus-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBaculusSighted(cards, card.id, !card.sighted))}>{card.sighted ? v4("bclClear") : v4("bclLay")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBaculusWood(cards, card.id, suggested))}>{v4("bclSuggest")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBaculusRack(cards, card.id, !card.racked))}>{card.racked ? v4("bclUnrack") : v4("bclRackIt")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBaculusVault(cards, card.id, !card.cased))}>{card.cased ? v4("bclUncase") : v4("bclCaseIt")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBaculusStar(cards, card.id, !card.starred))}>{card.starred ? v4("bclUnstar") : v4("bclStar")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addBaculusTag(cards, card.id, "b"))}>{v4("bclTag")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(liftNotchFocused(cards, card.id))}>{v4("bclLift")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerNotchFocused(cards, card.id))}>{v4("bclLower")}</button>
                <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(baculusCopy(card))}>{v4("bclCopy")}</button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

type AzimuthUser = { id?: string; name?: string | null; language?: boolean | string | number | null };

export function AzimuthPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: AzimuthUser[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<AzimuthShape>("all");
  const [review, setReview] = useState<AzimuthReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): AzimuthRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      azimuth: { language: textField(row.language) } satisfies AzimuthValue,
    };
  }).filter((row): row is AzimuthRow => Boolean(row));
  const present = presentAzimuthLanes(rows);
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
    const next = readHiddenAzimuths(readJson(AZM_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(AZM_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedAzimuths(readJson(AZM_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(AZM_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleAzimuthLanes(present, hidden, showHidden);
  const shown = visibleAzimuths(rows, lanes.includes(lane) || lane === "all" ? lane : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = azimuthLane(row.azimuth);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = azimuthLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingAzimuth(rows);
  const leadHue = leadingAzimuthHue(rows);
  const whole = rows.filter((row) => azimuthLane(row.azimuth)).length;
  const share = azimuthShare(laneAzimuthCount(rows, "house"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("azimuth-lanes.csv", azimuthLanesCsv(rows));
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
    writeJson(AZM_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(AZM_REVIEW_KEY, next);
  }

  return (
    <section className="c4-azimuth" aria-label={v4("azmTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-azimuth-mast">
        <p className="c4-azimuth-seal" data-logo="mono">{v4("azmLogo")}</p>
        <div>
          <p className="c4-azimuth-kicker">{v4("azmSub")}</p>
          <h2 className="c4-title">{v4("azmTitle")}</h2>
        </div>
        <p className="c4-azimuth-count">{shown.length}</p>
      </header>
      <p className="c4-azimuth-links">
        <Link href={crmv4Href(base, "bcl")}>{v4("bclTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("azmCustomer")}</Link>
      </p>
      <p className="c4-azimuth-hint">{v4("azmHint")}</p>
      {viewer && <p className="c4-azimuth-note">{v4("azmViewer")}</p>}
      <p className="c4-azimuth-meta">{v4("azmLead")} {laneLabel(v4, lead)} · {v4("azmToneLead")} {hueLabel(v4, leadHue)} · {v4("azmShare")} {share}</p>
      <div className="c4-azimuth-chart" aria-label={v4("azmChart")}>
        {lines.map((line) => (
          <button key={line.lane} type="button" className="c4-azimuth-column" data-on={lane === line.lane ? "1" : "0"} data-lane={line.lane} onClick={() => setLane(lane === line.lane ? "all" : line.lane)}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-azimuth-tools">
        <input ref={searchRef} className="c4-field c4-azimuth-search" aria-label={v4("azmSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("azmSearch")} />
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("azmShow")}</button>
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{v4(item === "all" ? "azmAll" : item === "reviewed" ? "azmReviewed" : "azmFresh")}</button>
        ))}
        {(["all", "champagne", "ivory", "graphite"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("azmAll") : hueLabel(v4, item)}</button>
        ))}
        {(Object.keys(SHAPE_KEY) as AzimuthShape[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" onClick={() => storeHidden(toggleAzimuth(hidden, item))}>{hidden.includes(item) ? v4("azmShow") : v4("azmHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-azimuth-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkAzimuthReview(reviewed, picked, true))}>{v4("azmBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkAzimuthReview(reviewed, picked, false))}>{v4("azmBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("azimuth-lanes.csv", azimuthLanesCsv(rows))}>{v4("azmCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("azimuth-rows.csv", azimuthRowsCsv(shown, reviewed))}>{v4("azmRowCsv")}</button>
      </div>
      {queue.loading && !rows.length && <p className="c4-meta">{v4("azmLoading")}</p>}
      {queue.error && <p className="c4-meta">{v4("azmFailed")}</p>}
      {!queue.loading && !queue.error && !rows.length && <p className="c4-pay-empty">{v4("azmEmpty")}</p>}
      <ul className="c4-azimuth-list">
        {shown.map((row) => {
          const name = azimuthCopy(row.azimuth);
          const tone = azimuthHue(row.azimuth);
          return (
            <li key={row.id} className="c4-azimuth-card" data-lane={azimuthLane(row.azimuth) || "open"} data-hue={tone || "none"} data-house={azimuthHouseSafe(row.azimuth)} data-open={azimuthOpen(row.azimuth) ? "1" : "0"} data-even={azimuthEven(row.azimuth) ? "1" : "0"} data-digit={azimuthDigit(row.azimuth) ? "1" : "0"} data-letter={azimuthLetter(row.azimuth) ? "1" : "0"} data-mixed={azimuthMixed(row.azimuth) ? "1" : "0"} data-upper={azimuthUpper(row.azimuth) ? "1" : "0"} data-lower={azimuthLower(row.azimuth) ? "1" : "0"} data-space={azimuthSpace(row.azimuth) ? "1" : "0"} data-vowel={azimuthVowel(row.azimuth) ? "1" : "0"} data-tail={azimuthTail(row.azimuth) ? "1" : "0"} data-first={azimuthFirst(row.azimuth) ? "1" : "0"} data-cased={azimuthHeld(row.azimuth) ? "1" : "0"} data-hyphen={azimuthHyphen(row.azimuth) ? "1" : "0"} data-period={azimuthPeriod(row.azimuth) ? "1" : "0"} data-capital={azimuthCapital(row.azimuth) ? "1" : "0"}>
              <label className="c4-azimuth-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-azimuth-meta">{name || v4("azmOpen")} · {azimuthStamp(row.azimuth) || "—"} · {azimuthFamily(row.azimuth) || "—"} · {azimuthLength(row.azimuth) ?? "—"} · {laneLabel(v4, azimuthLane(row.azimuth))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-azimuth-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleAzimuthReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("azmReviewed") : v4("azmReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const text = azimuthCopy(row.azimuth); if (!text) return; navigator.clipboard?.writeText(text); setCopied(row.id); }}>{copied === row.id ? v4("azmCopied") : v4("azmCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("azmCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function azimuthHouseSafe(raw: AzimuthValue): string {
  return azimuthLane(raw) === "house" ? "1" : "0";
}
