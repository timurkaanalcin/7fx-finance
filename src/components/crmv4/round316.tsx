"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  FRT_KEY,
  FRT_REVIEW_KEY,
  DPR_STAVES,
  DPR_DENSITY_KEY,
  DPR_KEY,
  DPR_VIEW_KEY,
  addDioptraTag,
  addDioptraView,
  addDioptra,
  briskDioptra,
  bulkFretReview,
  bulkDioptraVault,
  bulkDioptraSighted,
  bulkDioptraTag,
  bulkDioptraOak,
  busiestBearer,
  dropDioptraView,
  editDioptraNote,
  editDioptra,
  fairBearer,
  fretCapital,
  fretCopy,
  fretDigit,
  fretEven,
  fretFamily,
  fretFirst,
  fretHeld,
  fretHue,
  fretHyphen,
  fretLane,
  fretLanes,
  fretLanesCsv,
  fretLength,
  fretLetter,
  fretLower,
  fretMixed,
  fretOpen,
  fretPeriod,
  fretRowsCsv,
  fretShare,
  fretSpace,
  fretStamp,
  fretTail,
  fretUpper,
  fretVowel,
  idleDioptra,
  laneFretCount,
  lateDioptra,
  leadingFret,
  leadingFretHue,
  liftNotchFocused,
  lowerVaneFocused,
  lowerNotchFocused,
  moveDioptraFocus,
  dioptraBars,
  dioptraCopy,
  dioptraCounts,
  dioptraCsv,
  dioptraDensity,
  dioptraInner,
  dioptraOuter,
  dioptraBearers,
  dioptraTimeline,
  overdueDioptra,
  presentFretLanes,
  raiseVaneFocused,
  readHiddenFrets,
  readDioptraViews,
  readDioptraRules,
  readReviewedFrets,
  reminderDioptraRules,
  restingDioptra,
  setDioptraFocused,
  setDioptraVault,
  setDioptraSighted,
  setDioptraRack,
  setDioptraStar,
  setDioptraWood,
  sortDioptraRules,
  starDioptraFocused,
  suggestNotch,
  suggestStaff,
  suggestWood,
  toggleFret,
  toggleFretReview,
  visibleFretLanes,
  visibleFrets,
  visibleDioptraRules,
  woodFocused,
  rackDioptraFocused,
  type FretReview,
  type FretRow,
  type FretShape,
  type FretValue,
  type DioptraDensity,
  type DioptraSort,
  type DioptraTray,
  type DioptraView,
  type Dioptra,
} from "@/lib/crmv4/round316";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const WOODS = ["GILT", "IVORY", "SLATE"] as const;
const NOTCHES = ["4", "8", "16", "32"] as const;
const VANES = ["2", "4", "8"] as const;

const CLIMATE_KEY: Record<string, CrmV4CopyKey> = {
  lip: "dprReed",
  arc: "dprWand",
  rim: "dprPole",
  base: "dprMast",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "dprAuditSave",
  edit: "dprAuditEdit",
  note: "dprAuditNote",
  wood: "dprAuditWood",
  set: "dprAuditSet",
  clear: "dprAuditClear",
  sheath: "dprAuditRack",
  resume: "dprAuditResume",
  crypt: "dprAuditCase",
  open: "dprAuditOpen",
  tag: "dprAuditTag",
  vane: "dprAuditVane",
  notch: "dprAuditNotch",
  lower: "dprAuditLowerNotch",
  star: "dprAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  house: "frtHouse",
  fort: "frtFort",
  harbor: "frtHarbor",
  digit: "frtDigit",
  spark: "frtSpark",
  scroll: "frtScroll",
  vowel: "frtVowel",
  post: "frtPost",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "frtChampagne",
  ivory: "frtIvory",
  graphite: "frtGraphite",
};

const SHAPE_KEY: Record<FretShape, CrmV4CopyKey> = {
  all: "frtShapeAll",
  house: "frtShapeHouse",
  fort: "frtShapeFort",
  harbor: "frtShapeHarbor",
  digit: "frtShapeDigit",
  spark: "frtShapeSpark",
  scroll: "frtShapeScroll",
  vowel: "frtShapeVowel",
  post: "frtShapePost",
  open: "frtShapeOpen",
  soon: "frtShapeSoon",
  letter: "frtShapeLetter",
  mixed: "frtShapeMixed",
  upper: "frtShapeUpper",
  lower: "frtShapeLower",
  space: "frtShapeSpace",
  even: "frtShapeEven",
  odd: "frtShapeOdd",
  tail: "frtShapeTail",
  first: "frtShapeFirst",
  cased: "frtShapeHeld",
  hyphen: "frtShapeHyphen",
  period: "frtShapePeriod",
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
  return key ? v4(key) : v4("dprBlankBoard");
}

function woodLabel(v4: V4, wood: string): string {
  if (wood === "GILT") return v4("dprLime");
  if (wood === "IVORY") return v4("dprYew");
  if (wood === "SLATE") return v4("dprOak");
  return v4("dprAll");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("frtUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("frtUnmarked");
}

export function DioptraRules({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Dioptra[]>([]);
  const [views, setViews] = useState<DioptraView[]>([]);
  const [density, setDensity] = useState<DioptraDensity>("broad");
  const [tray, setTray] = useState<DioptraTray>("yard");
  const [query, setQuery] = useState("");
  const [bearerFilter, setBearerFilter] = useState("");
  const [woodFilter, setWoodFilter] = useState("all");
  const [staffFilter, setStaffFilter] = useState("all");
  const [notchFilter, setNotchFilter] = useState("all");
  const [vaneFilter, setVaneFilter] = useState("all");
  const [sort, setSort] = useState<DioptraSort>("staff");
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
    setCards(readDioptraRules(readJson(DPR_KEY, [])));
    setViews(readDioptraViews(readJson(DPR_VIEW_KEY, [])));
    setDensity(dioptraDensity(readJson(DPR_DENSITY_KEY, "broad")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Dioptra[]) {
    setCards(next);
    writeJson(DPR_KEY, next);
  }
  function storeViews(next: DioptraView[]) {
    setViews(next);
    writeJson(DPR_VIEW_KEY, next);
  }
  function storeDensity(next: DioptraDensity) {
    setDensity(next);
    writeJson(DPR_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortDioptraRules(visibleDioptraRules(cards, tray, query, bearerFilter, woodFilter, staffFilter, notchFilter, vaneFilter), sort),
    [cards, tray, query, bearerFilter, woodFilter, staffFilter, notchFilter, vaneFilter, sort],
  );
  const counts = dioptraCounts(cards, shown, desk);
  const bars = dioptraBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = dioptraTimeline(cards);
  const bearers = dioptraBearers(cards);
  const suggested = suggestWood(cards);
  const fair = fairBearer(cards, bearers.join(","));
  const busy = busiestBearer(cards);
  const reminders = reminderDioptraRules(cards);
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
        setFocusAt((index) => moveDioptraFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocusAt((index) => moveDioptraFocus(index, shown.length, -1));
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
        store(setDioptraVault(cards, id, !shown[focusAt]?.cased));
        return;
      }
      if (event.key === "m" || event.key === "M") {
        event.preventDefault();
        store(woodFocused(cards, id));
        return;
      }
      if (event.key === "c" || event.key === "C") {
        event.preventDefault();
        store(rackDioptraFocused(cards, id));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        store(setDioptraFocused(cards, id));
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("dioptra-rules.csv", dioptraCsv(shown, desk));
        return;
      }
      if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        store(starDioptraFocused(cards, id));
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
    <section className="c4-dioptra" aria-label={v4("dprTitle")} data-cards="1" data-desk={tray} data-names="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-dioptra-mast">
        <p className="c4-dioptra-seal" data-logo="mono">{v4("dprLogo")}</p>
        <div>
          <p className="c4-dioptra-kicker">{v4("dprSub")}</p>
          <h2 className="c4-title">{v4("dprTitle")}</h2>
        </div>
        <p className="c4-dioptra-count">{counts.matched}</p>
      </header>
      <ol className="c4-dioptra-index" aria-label={v4("dprTitle")}>
        <li data-tone="gold">{v4("dprBoard")} {counts.court}</li>
        <li data-tone="ink">{v4("dprOverdue")} {counts.overdue}</li>
        <li data-tone="ivory">{v4("dprHouse")} {counts.house}</li>
      </ol>
      <p className="c4-dioptra-links">
        <Link href={crmv4Href(base, "frt")}>{v4("frtTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("dprCustomers")}</Link>
      </p>
      <p className="c4-dioptra-hint">{v4("dprHint")}</p>
      {viewer && <p className="c4-dioptra-note">{v4("dprViewer")}</p>}
      {counts.overdue > 0 && <p className="c4-dioptra-notice" role="status">{v4("dprOverdue")} {counts.overdue}</p>}
      <ol className="c4-dioptra-dials" aria-label={v4("dprChart")}>
        <li>{v4("dprBoard")} {counts.court}</li>
        <li>{v4("dprRack")} {counts.rack}</li>
        <li>{v4("dprCase")} {counts.vault}</li>
        <li>{v4("dprInner")} {counts.inner}</li>
        <li>{v4("dprOuter")} {counts.outer}</li>
        <li>{v4("dprWide")} {counts.wide}</li>
        <li>{v4("dprStar")} {counts.starred}</li>
        <li>{v4("dprIdle")} {counts.idle}</li>
        <li>{v4("dprBrisk")} {counts.brisk}</li>
        <li>{v4("dprResting")} {counts.resting}</li>
      </ol>
      <div className="c4-dioptra-chart" aria-label={v4("dprChart")}>
        {bars.map((bar) => (
          <button key={bar.staff} type="button" className="c4-dioptra-column" data-on={staffFilter === bar.staff ? "1" : "0"} data-staff={bar.staff} onClick={() => setStaffFilter(staffFilter === bar.staff ? "all" : bar.staff)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{staffLabel(v4, bar.staff)}</span>
          </button>
        ))}
      </div>
      <div className="c4-dioptra-tools">
        <input ref={searchRef} className="c4-field c4-dioptra-search" aria-label={v4("dprSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("dprSearch")} />
        {(["yard", "rack", "case"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "yard" ? "dprBoard" : item === "rack" ? "dprRack" : "dprCase")}</button>
        ))}
        {(["all", "inner", "outer", ...DPR_STAVES] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={staffFilter === item ? "1" : "0"} onClick={() => setStaffFilter(item)}>{item === "all" ? v4("dprAll") : item === "inner" ? v4("dprInner") : item === "outer" ? v4("dprOuter") : staffLabel(v4, item)}</button>
        ))}
        {(["all", ...WOODS] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={woodFilter === item ? "1" : "0"} onClick={() => setWoodFilter(item)}>{item === "all" ? v4("dprAll") : woodLabel(v4, item)}</button>
        ))}
        {(["all", ...NOTCHES] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={notchFilter === item ? "1" : "0"} onClick={() => setNotchFilter(item)}>{item === "all" ? v4("dprNotch") : item}</button>
        ))}
        {(["all", ...VANES] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={vaneFilter === item ? "1" : "0"} onClick={() => setVaneFilter(item)}>{item === "all" ? v4("dprVane") : item}</button>
        ))}
        <button type="button" className="c4-chip" data-on={sort === "staff" ? "1" : "0"} onClick={() => setSort("staff")}>{v4("dprSortBoard")}</button>
        <button type="button" className="c4-chip" data-on={sort === "bearer" ? "1" : "0"} onClick={() => setSort("bearer")}>{v4("dprSortBearer")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "broad" : "tight")}>{density === "tight" ? v4("dprTight") : v4("dprBroad")}</button>
        {DPR_STAVES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={desk === item ? "1" : "0"} onClick={() => setDesk(item)}>{v4("dprDesk")} {staffLabel(v4, item)}</button>
        ))}
        {bearers.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={bearerFilter === name ? "1" : "0"} onClick={() => setBearerFilter(bearerFilter === name ? "" : name)}>{name}</button>
        ))}
      </div>
      <p className="c4-dioptra-meta">{v4("dprSuggest")} {woodLabel(v4, suggested)} · {notchHint} · {staffLabel(v4, staffHint)} · {v4("dprFair")} {fair || "—"} · {v4("dprBusy")} {busy || "—"}</p>
      {reminders.length > 0 && (
        <ul className="c4-dioptra-remind" aria-label={v4("dprRemind")}>
          {reminders.map((item) => <li key={item}>{item}</li>)}
        </ul>
      )}
      {timeline.length > 0 && (
        <ol className="c4-dioptra-time" aria-label={v4("dprTimeline")}>
          {timeline.map((lane) => <li key={lane.notch}>{lane.notch} · {lane.titles.join(" · ")}</li>)}
        </ol>
      )}
      <form className="c4-dioptra-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addDioptra(cards, { title, note, bearer, staff, wood, notch: notchNo, vane: vaneNo, tags });
        if (next.length === cards.length) return;
        store(next);
        setTitle("");
        setNote("");
        setTags("");
      }}>
        <input className="c4-field" aria-label={v4("dprEdit")} aria-required={false} value={title} onChange={(event) => setTitle(event.target.value)} placeholder={v4("dprEdit")} disabled={viewer} />
        <input className="c4-field" aria-label={v4("dprNote")} aria-required={false} value={note} onChange={(event) => setNote(event.target.value)} placeholder={v4("dprNote")} disabled={viewer} />
        <input className="c4-field" aria-label={v4("dprBearer")} aria-required={false} value={bearer} onChange={(event) => setBearer(event.target.value)} placeholder={v4("dprBearer")} disabled={viewer} />
        <select className="c4-select" aria-label={v4("dprDesk")} value={staff} onChange={(event) => setStaff(event.target.value)} disabled={viewer}>
          <option value="">{v4("dprBlankBoard")}</option>
          {DPR_STAVES.map((item) => <option key={item} value={item}>{staffLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("dprWood")} value={wood} onChange={(event) => setWood(event.target.value)} disabled={viewer}>
          <option value="">{v4("dprWood")}</option>
          {WOODS.map((item) => <option key={item} value={item}>{woodLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("dprNotch")} value={notchNo} onChange={(event) => setNotchNo(event.target.value)} disabled={viewer}>
          <option value="">{v4("dprNotch")}</option>
          {NOTCHES.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("dprVane")} value={vaneNo} onChange={(event) => setVaneNo(event.target.value)} disabled={viewer}>
          <option value="">{v4("dprVane")}</option>
          {VANES.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <input className="c4-field" aria-label={v4("dprTag")} aria-required={false} value={tags} onChange={(event) => setTags(event.target.value)} placeholder={v4("dprTag")} disabled={viewer} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("dprAdd")}</button>
      </form>
      <form className="c4-dioptra-views" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addDioptraView(views, { id: `v${Date.now().toString(36)}`, name: viewName, tray, query, bearer: bearerFilter, wood: woodFilter, staff: staffFilter, notch: notchFilter, vane: vaneFilter });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <input className="c4-field" aria-label={v4("dprViewName")} aria-required={false} value={viewName} onChange={(event) => setViewName(event.target.value)} placeholder={v4("dprViewName")} disabled={viewer} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("dprSaveView")}</button>
        {views.map((view) => (
          <span key={view.id} className="c4-dioptra-view">
            <button type="button" className="c4-chip" onClick={() => { setTray(view.tray); setQuery(view.query); setBearerFilter(view.bearer); setWoodFilter(view.wood); setStaffFilter(view.staff); setNotchFilter(view.notch); setVaneFilter(view.vane); }}>{v4("dprApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropDioptraView(views, view.id))}>{v4("dprDrop")}</button>
          </span>
        ))}
      </form>
      <div className="c4-dioptra-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkDioptraSighted(cards, picked))}>{v4("dprBulkLaid")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkDioptraOak(cards, picked))}>{v4("dprBulkOak")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkDioptraVault(cards, picked))}>{v4("dprBulkCrypt")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkDioptraTag(cards, picked))}>{v4("dprBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("dioptra-rules.csv", dioptraCsv(shown, desk))}>{v4("dprCsv")}</button>
      </div>
      <p className="c4-dioptra-keys">{v4("dprKeys")} j k / p o u d m c a s v x</p>
      {!shown.length && <p className="c4-pay-empty">{v4("dprEmpty")}</p>}
      <ul className="c4-dioptra-list" data-density={density}>
        {shown.map((card) => {
          const auditKey = AUDIT_KEY[card.audit];
          return (
            <li key={card.id} className="c4-dioptra-card" data-on={focused?.id === card.id ? "1" : "0"} data-staff={card.staff || "blank"} data-late={lateDioptra(card, desk) ? "1" : "0"} data-idle={idleDioptra(card) ? "1" : "0"} data-brisk={briskDioptra(card) ? "1" : "0"} data-resting={restingDioptra(card) ? "1" : "0"} data-overdue={overdueDioptra(card) ? "1" : "0"} data-inner={dioptraInner(card.staff) ? "1" : "0"} data-outer={dioptraOuter(card.staff) ? "1" : "0"}>
              <label className="c4-dioptra-pick">
                <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
              </label>
              <div>
                <input className="c4-field" aria-label={v4("dprEdit")} aria-required={false} defaultValue={card.title} disabled={viewer} onBlur={(event) => store(editDioptra(cards, card.id, event.target.value))} />
                <input className="c4-field" aria-label={v4("dprNote")} aria-required={false} defaultValue={card.note} disabled={viewer} onBlur={(event) => store(editDioptraNote(cards, card.id, event.target.value))} />
                <p className="c4-dioptra-meta">{card.bearer || "—"} · {staffLabel(v4, card.staff)} · {woodLabel(v4, card.wood)} · {card.notch ?? "—"} · {card.vane} · {card.tags.join(" ") || "—"}</p>
                {auditKey && <p className="c4-dioptra-audit">{v4(auditKey)}</p>}
              </div>
              <div className="c4-dioptra-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setDioptraSighted(cards, card.id, !card.sighted))}>{card.sighted ? v4("dprClear") : v4("dprLay")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setDioptraWood(cards, card.id, suggested))}>{v4("dprSuggest")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setDioptraRack(cards, card.id, !card.racked))}>{card.racked ? v4("dprUnrack") : v4("dprRackIt")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setDioptraVault(cards, card.id, !card.cased))}>{card.cased ? v4("dprUncase") : v4("dprCaseIt")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setDioptraStar(cards, card.id, !card.starred))}>{card.starred ? v4("dprUnstar") : v4("dprStar")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addDioptraTag(cards, card.id, "a"))}>{v4("dprTag")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(liftNotchFocused(cards, card.id))}>{v4("dprLift")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerNotchFocused(cards, card.id))}>{v4("dprLower")}</button>
                <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(dioptraCopy(card))}>{v4("dprCopy")}</button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

type FretUser = { id?: string; name?: string | null; tradingEnabled?: boolean | string | number | null };

export function FretPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: FretUser[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<FretShape>("all");
  const [review, setReview] = useState<FretReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): FretRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      fret: { tradingEnabled: textField(row.tradingEnabled) } satisfies FretValue,
    };
  }).filter((row): row is FretRow => Boolean(row));
  const present = presentFretLanes(rows);
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
    const next = readHiddenFrets(readJson(FRT_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(FRT_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedFrets(readJson(FRT_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(FRT_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleFretLanes(present, hidden, showHidden);
  const shown = visibleFrets(rows, lanes.includes(lane) || lane === "all" ? lane : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = fretLane(row.fret);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = fretLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingFret(rows);
  const leadHue = leadingFretHue(rows);
  const whole = rows.filter((row) => fretLane(row.fret)).length;
  const share = fretShare(laneFretCount(rows, "house"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("fret-lanes.csv", fretLanesCsv(rows));
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
    writeJson(FRT_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(FRT_REVIEW_KEY, next);
  }

  return (
    <section className="c4-fret" aria-label={v4("frtTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-fret-mast">
        <p className="c4-fret-seal" data-logo="mono">{v4("frtLogo")}</p>
        <div>
          <p className="c4-fret-kicker">{v4("frtSub")}</p>
          <h2 className="c4-title">{v4("frtTitle")}</h2>
        </div>
        <p className="c4-fret-count">{shown.length}</p>
      </header>
      <p className="c4-fret-links">
        <Link href={crmv4Href(base, "dpr")}>{v4("dprTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("frtCustomer")}</Link>
      </p>
      <p className="c4-fret-hint">{v4("frtHint")}</p>
      {viewer && <p className="c4-fret-note">{v4("frtViewer")}</p>}
      <p className="c4-fret-meta">{v4("frtLead")} {laneLabel(v4, lead)} · {v4("frtToneLead")} {hueLabel(v4, leadHue)} · {v4("frtShare")} {share}</p>
      <div className="c4-fret-chart" aria-label={v4("frtChart")}>
        {lines.map((line) => (
          <button key={line.lane} type="button" className="c4-fret-column" data-on={lane === line.lane ? "1" : "0"} data-lane={line.lane} onClick={() => setLane(lane === line.lane ? "all" : line.lane)}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-fret-tools">
        <input ref={searchRef} className="c4-field c4-fret-search" aria-label={v4("frtSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("frtSearch")} />
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("frtShow")}</button>
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{v4(item === "all" ? "frtAll" : item === "reviewed" ? "frtReviewed" : "frtFresh")}</button>
        ))}
        {(["all", "champagne", "ivory", "graphite"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("frtAll") : hueLabel(v4, item)}</button>
        ))}
        {(Object.keys(SHAPE_KEY) as FretShape[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" onClick={() => storeHidden(toggleFret(hidden, item))}>{hidden.includes(item) ? v4("frtShow") : v4("frtHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-fret-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkFretReview(reviewed, picked, true))}>{v4("frtBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkFretReview(reviewed, picked, false))}>{v4("frtBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("fret-lanes.csv", fretLanesCsv(rows))}>{v4("frtCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("fret-rows.csv", fretRowsCsv(shown, reviewed))}>{v4("frtRowCsv")}</button>
      </div>
      {queue.loading && !rows.length && <p className="c4-meta">{v4("frtLoading")}</p>}
      {queue.error && <p className="c4-meta">{v4("frtFailed")}</p>}
      {!queue.loading && !queue.error && !rows.length && <p className="c4-pay-empty">{v4("frtEmpty")}</p>}
      <ul className="c4-fret-list">
        {shown.map((row) => {
          const name = fretCopy(row.fret);
          const tone = fretHue(row.fret);
          return (
            <li key={row.id} className="c4-fret-card" data-lane={fretLane(row.fret) || "open"} data-hue={tone || "none"} data-house={fretHouseSafe(row.fret)} data-open={fretOpen(row.fret) ? "1" : "0"} data-even={fretEven(row.fret) ? "1" : "0"} data-digit={fretDigit(row.fret) ? "1" : "0"} data-letter={fretLetter(row.fret) ? "1" : "0"} data-mixed={fretMixed(row.fret) ? "1" : "0"} data-upper={fretUpper(row.fret) ? "1" : "0"} data-lower={fretLower(row.fret) ? "1" : "0"} data-space={fretSpace(row.fret) ? "1" : "0"} data-vowel={fretVowel(row.fret) ? "1" : "0"} data-tail={fretTail(row.fret) ? "1" : "0"} data-first={fretFirst(row.fret) ? "1" : "0"} data-cased={fretHeld(row.fret) ? "1" : "0"} data-hyphen={fretHyphen(row.fret) ? "1" : "0"} data-period={fretPeriod(row.fret) ? "1" : "0"} data-capital={fretCapital(row.fret) ? "1" : "0"}>
              <label className="c4-fret-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-fret-meta">{name || v4("frtOpen")} · {fretStamp(row.fret) || "—"} · {fretFamily(row.fret) || "—"} · {fretLength(row.fret) ?? "—"} · {laneLabel(v4, fretLane(row.fret))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-fret-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleFretReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("frtReviewed") : v4("frtReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const text = fretCopy(row.fret); if (!text) return; navigator.clipboard?.writeText(text); setCopied(row.id); }}>{copied === row.id ? v4("frtCopied") : v4("frtCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("frtCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function fretHouseSafe(raw: FretValue): string {
  return fretLane(raw) === "house" ? "1" : "0";
}
