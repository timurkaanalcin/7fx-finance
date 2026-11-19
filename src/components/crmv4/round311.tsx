"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  PCS_KEY,
  PCS_REVIEW_KEY,
  GMA_STAVES,
  GMA_DENSITY_KEY,
  GMA_KEY,
  GMA_VIEW_KEY,
  addGromaTag,
  addGromaView,
  addGroma,
  briskGroma,
  bulkPaceReview,
  bulkGromaVault,
  bulkGromaSighted,
  bulkGromaTag,
  bulkGromaOak,
  busiestBearer,
  dropGromaView,
  editGromaNote,
  editGroma,
  fairBearer,
  paceCapital,
  paceCopy,
  paceDigit,
  paceEven,
  paceFamily,
  paceFirst,
  paceHeld,
  paceHue,
  paceHyphen,
  paceLane,
  paceLanes,
  paceLanesCsv,
  paceLength,
  paceLetter,
  paceLower,
  paceMixed,
  paceOpen,
  pacePeriod,
  paceRowsCsv,
  paceShare,
  paceSpace,
  paceStamp,
  paceTail,
  paceUpper,
  paceVowel,
  idleGroma,
  lanePaceCount,
  lateGroma,
  leadingPace,
  leadingPaceHue,
  liftNotchFocused,
  lowerVaneFocused,
  lowerNotchFocused,
  moveGromaFocus,
  gromaBars,
  gromaCopy,
  gromaCounts,
  gromaCsv,
  gromaDensity,
  gromaInner,
  gromaOuter,
  gromaBearers,
  gromaTimeline,
  overdueGroma,
  presentPaceLanes,
  raiseVaneFocused,
  readHiddenPaces,
  readGromaViews,
  readGromaRules,
  readReviewedPaces,
  reminderGromaRules,
  restingGroma,
  setGromaFocused,
  setGromaVault,
  setGromaSighted,
  setGromaRack,
  setGromaStar,
  setGromaWood,
  sortGromaRules,
  starGromaFocused,
  suggestNotch,
  suggestStaff,
  suggestWood,
  togglePace,
  togglePaceReview,
  visiblePaceLanes,
  visiblePaces,
  visibleGromaRules,
  woodFocused,
  rackGromaFocused,
  type PaceReview,
  type PaceRow,
  type PaceShape,
  type PaceValue,
  type GromaDensity,
  type GromaSort,
  type GromaTray,
  type GromaView,
  type Groma,
} from "@/lib/crmv4/round311";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const WOODS = ["BRONZE", "IRON", "TIN"] as const;
const NOTCHES = ["3", "6", "12", "24"] as const;
const VANES = ["2", "4", "9"] as const;

const CLIMATE_KEY: Record<string, CrmV4CopyKey> = {
  cardo: "gmaReed",
  decumanus: "gmaWand",
  via: "gmaPole",
  limes: "gmaMast",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "gmaAuditSave",
  edit: "gmaAuditEdit",
  note: "gmaAuditNote",
  wood: "gmaAuditWood",
  set: "gmaAuditSet",
  clear: "gmaAuditClear",
  sheath: "gmaAuditRack",
  resume: "gmaAuditResume",
  crypt: "gmaAuditCase",
  open: "gmaAuditOpen",
  tag: "gmaAuditTag",
  vane: "gmaAuditVane",
  notch: "gmaAuditNotch",
  lower: "gmaAuditLowerNotch",
  star: "gmaAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  house: "pcsHouse",
  fort: "pcsFort",
  harbor: "pcsHarbor",
  digit: "pcsDigit",
  spark: "pcsSpark",
  scroll: "pcsScroll",
  vowel: "pcsVowel",
  post: "pcsPost",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "pcsChampagne",
  ivory: "pcsIvory",
  graphite: "pcsGraphite",
};

const SHAPE_KEY: Record<PaceShape, CrmV4CopyKey> = {
  all: "pcsShapeAll",
  house: "pcsShapeHouse",
  fort: "pcsShapeFort",
  harbor: "pcsShapeHarbor",
  digit: "pcsShapeDigit",
  spark: "pcsShapeSpark",
  scroll: "pcsShapeScroll",
  vowel: "pcsShapeVowel",
  post: "pcsShapePost",
  open: "pcsShapeOpen",
  soon: "pcsShapeSoon",
  letter: "pcsShapeLetter",
  mixed: "pcsShapeMixed",
  upper: "pcsShapeUpper",
  lower: "pcsShapeLower",
  space: "pcsShapeSpace",
  even: "pcsShapeEven",
  odd: "pcsShapeOdd",
  tail: "pcsShapeTail",
  first: "pcsShapeFirst",
  cased: "pcsShapeHeld",
  hyphen: "pcsShapeHyphen",
  period: "pcsShapePeriod",
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
  return key ? v4(key) : v4("gmaBlankBoard");
}

function woodLabel(v4: V4, wood: string): string {
  if (wood === "BRONZE") return v4("gmaLime");
  if (wood === "IRON") return v4("gmaYew");
  if (wood === "TIN") return v4("gmaOak");
  return v4("gmaAll");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("pcsUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("pcsUnmarked");
}

export function GromaRules({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Groma[]>([]);
  const [views, setViews] = useState<GromaView[]>([]);
  const [density, setDensity] = useState<GromaDensity>("broad");
  const [tray, setTray] = useState<GromaTray>("yard");
  const [query, setQuery] = useState("");
  const [bearerFilter, setBearerFilter] = useState("");
  const [woodFilter, setWoodFilter] = useState("all");
  const [staffFilter, setStaffFilter] = useState("all");
  const [notchFilter, setNotchFilter] = useState("all");
  const [vaneFilter, setVaneFilter] = useState("all");
  const [sort, setSort] = useState<GromaSort>("staff");
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
  const [desk, setDesk] = useState("cardo");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readGromaRules(readJson(GMA_KEY, [])));
    setViews(readGromaViews(readJson(GMA_VIEW_KEY, [])));
    setDensity(gromaDensity(readJson(GMA_DENSITY_KEY, "broad")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Groma[]) {
    setCards(next);
    writeJson(GMA_KEY, next);
  }
  function storeViews(next: GromaView[]) {
    setViews(next);
    writeJson(GMA_VIEW_KEY, next);
  }
  function storeDensity(next: GromaDensity) {
    setDensity(next);
    writeJson(GMA_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortGromaRules(visibleGromaRules(cards, tray, query, bearerFilter, woodFilter, staffFilter, notchFilter, vaneFilter), sort),
    [cards, tray, query, bearerFilter, woodFilter, staffFilter, notchFilter, vaneFilter, sort],
  );
  const counts = gromaCounts(cards, shown, desk);
  const bars = gromaBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = gromaTimeline(cards);
  const bearers = gromaBearers(cards);
  const suggested = suggestWood(cards);
  const fair = fairBearer(cards, bearers.join(","));
  const busy = busiestBearer(cards);
  const reminders = reminderGromaRules(cards);
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
        setFocusAt((index) => moveGromaFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocusAt((index) => moveGromaFocus(index, shown.length, -1));
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
        store(setGromaVault(cards, id, !shown[focusAt]?.cased));
        return;
      }
      if (event.key === "m" || event.key === "M") {
        event.preventDefault();
        store(woodFocused(cards, id));
        return;
      }
      if (event.key === "c" || event.key === "C") {
        event.preventDefault();
        store(rackGromaFocused(cards, id));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        store(setGromaFocused(cards, id));
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("groma-rules.csv", gromaCsv(shown, desk));
        return;
      }
      if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        store(starGromaFocused(cards, id));
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
    <section className="c4-groma" aria-label={v4("gmaTitle")} data-cards="1" data-desk={tray} data-names="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-groma-mast">
        <p className="c4-groma-seal" data-logo="mono">{v4("gmaLogo")}</p>
        <div>
          <p className="c4-groma-kicker">{v4("gmaSub")}</p>
          <h2 className="c4-title">{v4("gmaTitle")}</h2>
        </div>
        <p className="c4-groma-count">{counts.matched}</p>
      </header>
      <ol className="c4-groma-index" aria-label={v4("gmaTitle")}>
        <li data-tone="gold">{v4("gmaBoard")} {counts.court}</li>
        <li data-tone="ink">{v4("gmaOverdue")} {counts.overdue}</li>
        <li data-tone="ivory">{v4("gmaHouse")} {counts.house}</li>
      </ol>
      <p className="c4-groma-links">
        <Link href={crmv4Href(base, "pcs")}>{v4("pcsTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("gmaCustomers")}</Link>
      </p>
      <p className="c4-groma-hint">{v4("gmaHint")}</p>
      {viewer && <p className="c4-groma-note">{v4("gmaViewer")}</p>}
      {counts.overdue > 0 && <p className="c4-groma-notice" role="status">{v4("gmaOverdue")} {counts.overdue}</p>}
      <ol className="c4-groma-dials" aria-label={v4("gmaChart")}>
        <li>{v4("gmaBoard")} {counts.court}</li>
        <li>{v4("gmaRack")} {counts.rack}</li>
        <li>{v4("gmaCase")} {counts.vault}</li>
        <li>{v4("gmaInner")} {counts.inner}</li>
        <li>{v4("gmaOuter")} {counts.outer}</li>
        <li>{v4("gmaWide")} {counts.wide}</li>
        <li>{v4("gmaStar")} {counts.starred}</li>
        <li>{v4("gmaIdle")} {counts.idle}</li>
        <li>{v4("gmaBrisk")} {counts.brisk}</li>
        <li>{v4("gmaResting")} {counts.resting}</li>
      </ol>
      <div className="c4-groma-chart" aria-label={v4("gmaChart")}>
        {bars.map((bar) => (
          <button key={bar.staff} type="button" className="c4-groma-column" data-on={staffFilter === bar.staff ? "1" : "0"} data-staff={bar.staff} onClick={() => setStaffFilter(staffFilter === bar.staff ? "all" : bar.staff)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{staffLabel(v4, bar.staff)}</span>
          </button>
        ))}
      </div>
      <div className="c4-groma-tools">
        <input ref={searchRef} className="c4-field c4-groma-search" aria-label={v4("gmaSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("gmaSearch")} />
        {(["yard", "rack", "case"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "yard" ? "gmaBoard" : item === "rack" ? "gmaRack" : "gmaCase")}</button>
        ))}
        {(["all", "inner", "outer", ...GMA_STAVES] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={staffFilter === item ? "1" : "0"} onClick={() => setStaffFilter(item)}>{item === "all" ? v4("gmaAll") : item === "inner" ? v4("gmaInner") : item === "outer" ? v4("gmaOuter") : staffLabel(v4, item)}</button>
        ))}
        {(["all", ...WOODS] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={woodFilter === item ? "1" : "0"} onClick={() => setWoodFilter(item)}>{item === "all" ? v4("gmaAll") : woodLabel(v4, item)}</button>
        ))}
        {(["all", ...NOTCHES] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={notchFilter === item ? "1" : "0"} onClick={() => setNotchFilter(item)}>{item === "all" ? v4("gmaNotch") : item}</button>
        ))}
        {(["all", ...VANES] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={vaneFilter === item ? "1" : "0"} onClick={() => setVaneFilter(item)}>{item === "all" ? v4("gmaVane") : item}</button>
        ))}
        <button type="button" className="c4-chip" data-on={sort === "staff" ? "1" : "0"} onClick={() => setSort("staff")}>{v4("gmaSortBoard")}</button>
        <button type="button" className="c4-chip" data-on={sort === "bearer" ? "1" : "0"} onClick={() => setSort("bearer")}>{v4("gmaSortBearer")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "broad" : "tight")}>{density === "tight" ? v4("gmaTight") : v4("gmaBroad")}</button>
        {GMA_STAVES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={desk === item ? "1" : "0"} onClick={() => setDesk(item)}>{v4("gmaDesk")} {staffLabel(v4, item)}</button>
        ))}
        {bearers.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={bearerFilter === name ? "1" : "0"} onClick={() => setBearerFilter(bearerFilter === name ? "" : name)}>{name}</button>
        ))}
      </div>
      <p className="c4-groma-meta">{v4("gmaSuggest")} {woodLabel(v4, suggested)} · {notchHint} · {staffLabel(v4, staffHint)} · {v4("gmaFair")} {fair || "—"} · {v4("gmaBusy")} {busy || "—"}</p>
      {reminders.length > 0 && (
        <ul className="c4-groma-remind" aria-label={v4("gmaRemind")}>
          {reminders.map((item) => <li key={item}>{item}</li>)}
        </ul>
      )}
      {timeline.length > 0 && (
        <ol className="c4-groma-time" aria-label={v4("gmaTimeline")}>
          {timeline.map((lane) => <li key={lane.notch}>{lane.notch} · {lane.titles.join(" · ")}</li>)}
        </ol>
      )}
      <form className="c4-groma-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addGroma(cards, { title, note, bearer, staff, wood, notch: notchNo, vane: vaneNo, tags });
        if (next.length === cards.length) return;
        store(next);
        setTitle("");
        setNote("");
        setTags("");
      }}>
        <input className="c4-field" aria-label={v4("gmaEdit")} aria-required={false} value={title} onChange={(event) => setTitle(event.target.value)} placeholder={v4("gmaEdit")} disabled={viewer} />
        <input className="c4-field" aria-label={v4("gmaNote")} aria-required={false} value={note} onChange={(event) => setNote(event.target.value)} placeholder={v4("gmaNote")} disabled={viewer} />
        <input className="c4-field" aria-label={v4("gmaBearer")} aria-required={false} value={bearer} onChange={(event) => setBearer(event.target.value)} placeholder={v4("gmaBearer")} disabled={viewer} />
        <select className="c4-select" aria-label={v4("gmaDesk")} value={staff} onChange={(event) => setStaff(event.target.value)} disabled={viewer}>
          <option value="">{v4("gmaBlankBoard")}</option>
          {GMA_STAVES.map((item) => <option key={item} value={item}>{staffLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("gmaWood")} value={wood} onChange={(event) => setWood(event.target.value)} disabled={viewer}>
          <option value="">{v4("gmaWood")}</option>
          {WOODS.map((item) => <option key={item} value={item}>{woodLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("gmaNotch")} value={notchNo} onChange={(event) => setNotchNo(event.target.value)} disabled={viewer}>
          <option value="">{v4("gmaNotch")}</option>
          {NOTCHES.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("gmaVane")} value={vaneNo} onChange={(event) => setVaneNo(event.target.value)} disabled={viewer}>
          <option value="">{v4("gmaVane")}</option>
          {VANES.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <input className="c4-field" aria-label={v4("gmaTag")} aria-required={false} value={tags} onChange={(event) => setTags(event.target.value)} placeholder={v4("gmaTag")} disabled={viewer} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("gmaAdd")}</button>
      </form>
      <form className="c4-groma-views" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addGromaView(views, { id: `v${Date.now().toString(36)}`, name: viewName, tray, query, bearer: bearerFilter, wood: woodFilter, staff: staffFilter, notch: notchFilter, vane: vaneFilter });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <input className="c4-field" aria-label={v4("gmaViewName")} aria-required={false} value={viewName} onChange={(event) => setViewName(event.target.value)} placeholder={v4("gmaViewName")} disabled={viewer} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("gmaSaveView")}</button>
        {views.map((view) => (
          <span key={view.id} className="c4-groma-view">
            <button type="button" className="c4-chip" onClick={() => { setTray(view.tray); setQuery(view.query); setBearerFilter(view.bearer); setWoodFilter(view.wood); setStaffFilter(view.staff); setNotchFilter(view.notch); setVaneFilter(view.vane); }}>{v4("gmaApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropGromaView(views, view.id))}>{v4("gmaDrop")}</button>
          </span>
        ))}
      </form>
      <div className="c4-groma-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkGromaSighted(cards, picked))}>{v4("gmaBulkLaid")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkGromaOak(cards, picked))}>{v4("gmaBulkOak")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkGromaVault(cards, picked))}>{v4("gmaBulkCrypt")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkGromaTag(cards, picked))}>{v4("gmaBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("groma-rules.csv", gromaCsv(shown, desk))}>{v4("gmaCsv")}</button>
      </div>
      <p className="c4-groma-keys">{v4("gmaKeys")} j k / p o u d m c a s v x</p>
      {!shown.length && <p className="c4-pay-empty">{v4("gmaEmpty")}</p>}
      <ul className="c4-groma-list" data-density={density}>
        {shown.map((card) => {
          const auditKey = AUDIT_KEY[card.audit];
          return (
            <li key={card.id} className="c4-groma-card" data-on={focused?.id === card.id ? "1" : "0"} data-staff={card.staff || "blank"} data-late={lateGroma(card, desk) ? "1" : "0"} data-idle={idleGroma(card) ? "1" : "0"} data-brisk={briskGroma(card) ? "1" : "0"} data-resting={restingGroma(card) ? "1" : "0"} data-overdue={overdueGroma(card) ? "1" : "0"} data-inner={gromaInner(card.staff) ? "1" : "0"} data-outer={gromaOuter(card.staff) ? "1" : "0"}>
              <label className="c4-groma-pick">
                <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
              </label>
              <div>
                <input className="c4-field" aria-label={v4("gmaEdit")} aria-required={false} defaultValue={card.title} disabled={viewer} onBlur={(event) => store(editGroma(cards, card.id, event.target.value))} />
                <input className="c4-field" aria-label={v4("gmaNote")} aria-required={false} defaultValue={card.note} disabled={viewer} onBlur={(event) => store(editGromaNote(cards, card.id, event.target.value))} />
                <p className="c4-groma-meta">{card.bearer || "—"} · {staffLabel(v4, card.staff)} · {woodLabel(v4, card.wood)} · {card.notch ?? "—"} · {card.vane} · {card.tags.join(" ") || "—"}</p>
                {auditKey && <p className="c4-groma-audit">{v4(auditKey)}</p>}
              </div>
              <div className="c4-groma-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setGromaSighted(cards, card.id, !card.sighted))}>{card.sighted ? v4("gmaClear") : v4("gmaLay")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setGromaWood(cards, card.id, suggested))}>{v4("gmaSuggest")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setGromaRack(cards, card.id, !card.racked))}>{card.racked ? v4("gmaUnrack") : v4("gmaRackIt")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setGromaVault(cards, card.id, !card.cased))}>{card.cased ? v4("gmaUncase") : v4("gmaCaseIt")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setGromaStar(cards, card.id, !card.starred))}>{card.starred ? v4("gmaUnstar") : v4("gmaStar")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addGromaTag(cards, card.id, "c"))}>{v4("gmaTag")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(liftNotchFocused(cards, card.id))}>{v4("gmaLift")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerNotchFocused(cards, card.id))}>{v4("gmaLower")}</button>
                <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(gromaCopy(card))}>{v4("gmaCopy")}</button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

type PaceUser = { id?: string; name?: string | null; lastBrowser?: boolean | string | number | null };

export function PacePlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: PaceUser[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<PaceShape>("all");
  const [review, setReview] = useState<PaceReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): PaceRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      pace: { lastBrowser: textField(row.lastBrowser) } satisfies PaceValue,
    };
  }).filter((row): row is PaceRow => Boolean(row));
  const present = presentPaceLanes(rows);
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
    const next = readHiddenPaces(readJson(PCS_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(PCS_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedPaces(readJson(PCS_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(PCS_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visiblePaceLanes(present, hidden, showHidden);
  const shown = visiblePaces(rows, lanes.includes(lane) || lane === "all" ? lane : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = paceLane(row.pace);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = paceLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingPace(rows);
  const leadHue = leadingPaceHue(rows);
  const whole = rows.filter((row) => paceLane(row.pace)).length;
  const share = paceShare(lanePaceCount(rows, "house"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("pace-lanes.csv", paceLanesCsv(rows));
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
    writeJson(PCS_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(PCS_REVIEW_KEY, next);
  }

  return (
    <section className="c4-pace" aria-label={v4("pcsTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-pace-mast">
        <p className="c4-pace-seal" data-logo="mono">{v4("pcsLogo")}</p>
        <div>
          <p className="c4-pace-kicker">{v4("pcsSub")}</p>
          <h2 className="c4-title">{v4("pcsTitle")}</h2>
        </div>
        <p className="c4-pace-count">{shown.length}</p>
      </header>
      <p className="c4-pace-links">
        <Link href={crmv4Href(base, "gma")}>{v4("gmaTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("pcsCustomer")}</Link>
      </p>
      <p className="c4-pace-hint">{v4("pcsHint")}</p>
      {viewer && <p className="c4-pace-note">{v4("pcsViewer")}</p>}
      <p className="c4-pace-meta">{v4("pcsLead")} {laneLabel(v4, lead)} · {v4("pcsToneLead")} {hueLabel(v4, leadHue)} · {v4("pcsShare")} {share}</p>
      <div className="c4-pace-chart" aria-label={v4("pcsChart")}>
        {lines.map((line) => (
          <button key={line.lane} type="button" className="c4-pace-column" data-on={lane === line.lane ? "1" : "0"} data-lane={line.lane} onClick={() => setLane(lane === line.lane ? "all" : line.lane)}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-pace-tools">
        <input ref={searchRef} className="c4-field c4-pace-search" aria-label={v4("pcsSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("pcsSearch")} />
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("pcsShow")}</button>
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{v4(item === "all" ? "pcsAll" : item === "reviewed" ? "pcsReviewed" : "pcsFresh")}</button>
        ))}
        {(["all", "champagne", "ivory", "graphite"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("pcsAll") : hueLabel(v4, item)}</button>
        ))}
        {(Object.keys(SHAPE_KEY) as PaceShape[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" onClick={() => storeHidden(togglePace(hidden, item))}>{hidden.includes(item) ? v4("pcsShow") : v4("pcsHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-pace-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkPaceReview(reviewed, picked, true))}>{v4("pcsBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkPaceReview(reviewed, picked, false))}>{v4("pcsBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("pace-lanes.csv", paceLanesCsv(rows))}>{v4("pcsCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("pace-rows.csv", paceRowsCsv(shown, reviewed))}>{v4("pcsRowCsv")}</button>
      </div>
      {queue.loading && !rows.length && <p className="c4-meta">{v4("pcsLoading")}</p>}
      {queue.error && <p className="c4-meta">{v4("pcsFailed")}</p>}
      {!queue.loading && !queue.error && !rows.length && <p className="c4-pay-empty">{v4("pcsEmpty")}</p>}
      <ul className="c4-pace-list">
        {shown.map((row) => {
          const name = paceCopy(row.pace);
          const tone = paceHue(row.pace);
          return (
            <li key={row.id} className="c4-pace-card" data-lane={paceLane(row.pace) || "open"} data-hue={tone || "none"} data-house={paceHouseSafe(row.pace)} data-open={paceOpen(row.pace) ? "1" : "0"} data-even={paceEven(row.pace) ? "1" : "0"} data-digit={paceDigit(row.pace) ? "1" : "0"} data-letter={paceLetter(row.pace) ? "1" : "0"} data-mixed={paceMixed(row.pace) ? "1" : "0"} data-upper={paceUpper(row.pace) ? "1" : "0"} data-lower={paceLower(row.pace) ? "1" : "0"} data-space={paceSpace(row.pace) ? "1" : "0"} data-vowel={paceVowel(row.pace) ? "1" : "0"} data-tail={paceTail(row.pace) ? "1" : "0"} data-first={paceFirst(row.pace) ? "1" : "0"} data-cased={paceHeld(row.pace) ? "1" : "0"} data-hyphen={paceHyphen(row.pace) ? "1" : "0"} data-period={pacePeriod(row.pace) ? "1" : "0"} data-capital={paceCapital(row.pace) ? "1" : "0"}>
              <label className="c4-pace-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-pace-meta">{name || v4("pcsOpen")} · {paceStamp(row.pace) || "—"} · {paceFamily(row.pace) || "—"} · {paceLength(row.pace) ?? "—"} · {laneLabel(v4, paceLane(row.pace))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-pace-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(togglePaceReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("pcsReviewed") : v4("pcsReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const text = paceCopy(row.pace); if (!text) return; navigator.clipboard?.writeText(text); setCopied(row.id); }}>{copied === row.id ? v4("pcsCopied") : v4("pcsCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("pcsCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function paceHouseSafe(raw: PaceValue): string {
  return paceLane(raw) === "house" ? "1" : "0";
}
