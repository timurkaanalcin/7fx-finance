"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  SIG_KEY,
  SIG_REVIEW_KEY,
  LBL_STAVES,
  LBL_DENSITY_KEY,
  LBL_KEY,
  LBL_VIEW_KEY,
  addLibellaTag,
  addLibellaView,
  addLibella,
  briskLibella,
  bulkSigilReview,
  bulkLibellaVault,
  bulkLibellaSighted,
  bulkLibellaTag,
  bulkLibellaOak,
  busiestBearer,
  dropLibellaView,
  editLibellaNote,
  editLibella,
  fairBearer,
  sigilCapital,
  sigilCopy,
  sigilDigit,
  sigilEven,
  sigilFamily,
  sigilFirst,
  sigilHeld,
  sigilHue,
  sigilHyphen,
  sigilLane,
  sigilLanes,
  sigilLanesCsv,
  sigilLength,
  sigilLetter,
  sigilLower,
  sigilMixed,
  sigilOpen,
  sigilPeriod,
  sigilRowsCsv,
  sigilShare,
  sigilSpace,
  sigilStamp,
  sigilTail,
  sigilUpper,
  sigilVowel,
  idleLibella,
  laneSigilCount,
  lateLibella,
  leadingSigil,
  leadingSigilHue,
  liftNotchFocused,
  lowerVaneFocused,
  lowerNotchFocused,
  moveLibellaFocus,
  libellaBars,
  libellaCopy,
  libellaCounts,
  libellaCsv,
  libellaDensity,
  libellaInner,
  libellaOuter,
  libellaBearers,
  libellaTimeline,
  overdueLibella,
  presentSigilLanes,
  raiseVaneFocused,
  readHiddenSigils,
  readLibellaViews,
  readLibellaRules,
  readReviewedSigils,
  reminderLibellaRules,
  restingLibella,
  setLibellaFocused,
  setLibellaVault,
  setLibellaSighted,
  setLibellaRack,
  setLibellaStar,
  setLibellaWood,
  sortLibellaRules,
  starLibellaFocused,
  suggestNotch,
  suggestStaff,
  suggestWood,
  toggleSigil,
  toggleSigilReview,
  visibleSigilLanes,
  visibleSigils,
  visibleLibellaRules,
  woodFocused,
  rackLibellaFocused,
  type SigilReview,
  type SigilRow,
  type SigilShape,
  type SigilValue,
  type LibellaDensity,
  type LibellaSort,
  type LibellaTray,
  type LibellaView,
  type Libella,
} from "@/lib/crmv4/round312";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const WOODS = ["CEDAR", "OAK", "PINE"] as const;
const NOTCHES = ["5", "10", "15", "20"] as const;
const VANES = ["1", "3", "7"] as const;

const CLIMATE_KEY: Record<string, CrmV4CopyKey> = {
  stem: "lblReed",
  brace: "lblWand",
  plumb: "lblPole",
  foot: "lblMast",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "lblAuditSave",
  edit: "lblAuditEdit",
  note: "lblAuditNote",
  wood: "lblAuditWood",
  set: "lblAuditSet",
  clear: "lblAuditClear",
  sheath: "lblAuditRack",
  resume: "lblAuditResume",
  crypt: "lblAuditCase",
  open: "lblAuditOpen",
  tag: "lblAuditTag",
  vane: "lblAuditVane",
  notch: "lblAuditNotch",
  lower: "lblAuditLowerNotch",
  star: "lblAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  house: "sigHouse",
  fort: "sigFort",
  harbor: "sigHarbor",
  digit: "sigDigit",
  spark: "sigSpark",
  scroll: "sigScroll",
  vowel: "sigVowel",
  post: "sigPost",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "sigChampagne",
  ivory: "sigIvory",
  graphite: "sigGraphite",
};

const SHAPE_KEY: Record<SigilShape, CrmV4CopyKey> = {
  all: "sigShapeAll",
  house: "sigShapeHouse",
  fort: "sigShapeFort",
  harbor: "sigShapeHarbor",
  digit: "sigShapeDigit",
  spark: "sigShapeSpark",
  scroll: "sigShapeScroll",
  vowel: "sigShapeVowel",
  post: "sigShapePost",
  open: "sigShapeOpen",
  soon: "sigShapeSoon",
  letter: "sigShapeLetter",
  mixed: "sigShapeMixed",
  upper: "sigShapeUpper",
  lower: "sigShapeLower",
  space: "sigShapeSpace",
  even: "sigShapeEven",
  odd: "sigShapeOdd",
  tail: "sigShapeTail",
  first: "sigShapeFirst",
  cased: "sigShapeHeld",
  hyphen: "sigShapeHyphen",
  period: "sigShapePeriod",
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
  return key ? v4(key) : v4("lblBlankBoard");
}

function woodLabel(v4: V4, wood: string): string {
  if (wood === "CEDAR") return v4("lblLime");
  if (wood === "OAK") return v4("lblYew");
  if (wood === "PINE") return v4("lblOak");
  return v4("lblAll");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("sigUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("sigUnmarked");
}

export function LibellaRules({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Libella[]>([]);
  const [views, setViews] = useState<LibellaView[]>([]);
  const [density, setDensity] = useState<LibellaDensity>("broad");
  const [tray, setTray] = useState<LibellaTray>("yard");
  const [query, setQuery] = useState("");
  const [bearerFilter, setBearerFilter] = useState("");
  const [woodFilter, setWoodFilter] = useState("all");
  const [staffFilter, setStaffFilter] = useState("all");
  const [notchFilter, setNotchFilter] = useState("all");
  const [vaneFilter, setVaneFilter] = useState("all");
  const [sort, setSort] = useState<LibellaSort>("staff");
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
  const [desk, setDesk] = useState("stem");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readLibellaRules(readJson(LBL_KEY, [])));
    setViews(readLibellaViews(readJson(LBL_VIEW_KEY, [])));
    setDensity(libellaDensity(readJson(LBL_DENSITY_KEY, "broad")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Libella[]) {
    setCards(next);
    writeJson(LBL_KEY, next);
  }
  function storeViews(next: LibellaView[]) {
    setViews(next);
    writeJson(LBL_VIEW_KEY, next);
  }
  function storeDensity(next: LibellaDensity) {
    setDensity(next);
    writeJson(LBL_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortLibellaRules(visibleLibellaRules(cards, tray, query, bearerFilter, woodFilter, staffFilter, notchFilter, vaneFilter), sort),
    [cards, tray, query, bearerFilter, woodFilter, staffFilter, notchFilter, vaneFilter, sort],
  );
  const counts = libellaCounts(cards, shown, desk);
  const bars = libellaBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = libellaTimeline(cards);
  const bearers = libellaBearers(cards);
  const suggested = suggestWood(cards);
  const fair = fairBearer(cards, bearers.join(","));
  const busy = busiestBearer(cards);
  const reminders = reminderLibellaRules(cards);
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
        setFocusAt((index) => moveLibellaFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocusAt((index) => moveLibellaFocus(index, shown.length, -1));
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
        store(setLibellaVault(cards, id, !shown[focusAt]?.cased));
        return;
      }
      if (event.key === "m" || event.key === "M") {
        event.preventDefault();
        store(woodFocused(cards, id));
        return;
      }
      if (event.key === "c" || event.key === "C") {
        event.preventDefault();
        store(rackLibellaFocused(cards, id));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        store(setLibellaFocused(cards, id));
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("libella-rules.csv", libellaCsv(shown, desk));
        return;
      }
      if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        store(starLibellaFocused(cards, id));
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
    <section className="c4-libella" aria-label={v4("lblTitle")} data-cards="1" data-desk={tray} data-names="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-libella-mast">
        <p className="c4-libella-seal" data-logo="mono">{v4("lblLogo")}</p>
        <div>
          <p className="c4-libella-kicker">{v4("lblSub")}</p>
          <h2 className="c4-title">{v4("lblTitle")}</h2>
        </div>
        <p className="c4-libella-count">{counts.matched}</p>
      </header>
      <ol className="c4-libella-index" aria-label={v4("lblTitle")}>
        <li data-tone="gold">{v4("lblBoard")} {counts.court}</li>
        <li data-tone="ink">{v4("lblOverdue")} {counts.overdue}</li>
        <li data-tone="ivory">{v4("lblHouse")} {counts.house}</li>
      </ol>
      <p className="c4-libella-links">
        <Link href={crmv4Href(base, "sig")}>{v4("sigTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("lblCustomers")}</Link>
      </p>
      <p className="c4-libella-hint">{v4("lblHint")}</p>
      {viewer && <p className="c4-libella-note">{v4("lblViewer")}</p>}
      {counts.overdue > 0 && <p className="c4-libella-notice" role="status">{v4("lblOverdue")} {counts.overdue}</p>}
      <ol className="c4-libella-dials" aria-label={v4("lblChart")}>
        <li>{v4("lblBoard")} {counts.court}</li>
        <li>{v4("lblRack")} {counts.rack}</li>
        <li>{v4("lblCase")} {counts.vault}</li>
        <li>{v4("lblInner")} {counts.inner}</li>
        <li>{v4("lblOuter")} {counts.outer}</li>
        <li>{v4("lblWide")} {counts.wide}</li>
        <li>{v4("lblStar")} {counts.starred}</li>
        <li>{v4("lblIdle")} {counts.idle}</li>
        <li>{v4("lblBrisk")} {counts.brisk}</li>
        <li>{v4("lblResting")} {counts.resting}</li>
      </ol>
      <div className="c4-libella-chart" aria-label={v4("lblChart")}>
        {bars.map((bar) => (
          <button key={bar.staff} type="button" className="c4-libella-column" data-on={staffFilter === bar.staff ? "1" : "0"} data-staff={bar.staff} onClick={() => setStaffFilter(staffFilter === bar.staff ? "all" : bar.staff)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{staffLabel(v4, bar.staff)}</span>
          </button>
        ))}
      </div>
      <div className="c4-libella-tools">
        <input ref={searchRef} className="c4-field c4-libella-search" aria-label={v4("lblSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("lblSearch")} />
        {(["yard", "rack", "case"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "yard" ? "lblBoard" : item === "rack" ? "lblRack" : "lblCase")}</button>
        ))}
        {(["all", "inner", "outer", ...LBL_STAVES] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={staffFilter === item ? "1" : "0"} onClick={() => setStaffFilter(item)}>{item === "all" ? v4("lblAll") : item === "inner" ? v4("lblInner") : item === "outer" ? v4("lblOuter") : staffLabel(v4, item)}</button>
        ))}
        {(["all", ...WOODS] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={woodFilter === item ? "1" : "0"} onClick={() => setWoodFilter(item)}>{item === "all" ? v4("lblAll") : woodLabel(v4, item)}</button>
        ))}
        {(["all", ...NOTCHES] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={notchFilter === item ? "1" : "0"} onClick={() => setNotchFilter(item)}>{item === "all" ? v4("lblNotch") : item}</button>
        ))}
        {(["all", ...VANES] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={vaneFilter === item ? "1" : "0"} onClick={() => setVaneFilter(item)}>{item === "all" ? v4("lblVane") : item}</button>
        ))}
        <button type="button" className="c4-chip" data-on={sort === "staff" ? "1" : "0"} onClick={() => setSort("staff")}>{v4("lblSortBoard")}</button>
        <button type="button" className="c4-chip" data-on={sort === "bearer" ? "1" : "0"} onClick={() => setSort("bearer")}>{v4("lblSortBearer")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "broad" : "tight")}>{density === "tight" ? v4("lblTight") : v4("lblBroad")}</button>
        {LBL_STAVES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={desk === item ? "1" : "0"} onClick={() => setDesk(item)}>{v4("lblDesk")} {staffLabel(v4, item)}</button>
        ))}
        {bearers.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={bearerFilter === name ? "1" : "0"} onClick={() => setBearerFilter(bearerFilter === name ? "" : name)}>{name}</button>
        ))}
      </div>
      <p className="c4-libella-meta">{v4("lblSuggest")} {woodLabel(v4, suggested)} · {notchHint} · {staffLabel(v4, staffHint)} · {v4("lblFair")} {fair || "—"} · {v4("lblBusy")} {busy || "—"}</p>
      {reminders.length > 0 && (
        <ul className="c4-libella-remind" aria-label={v4("lblRemind")}>
          {reminders.map((item) => <li key={item}>{item}</li>)}
        </ul>
      )}
      {timeline.length > 0 && (
        <ol className="c4-libella-time" aria-label={v4("lblTimeline")}>
          {timeline.map((lane) => <li key={lane.notch}>{lane.notch} · {lane.titles.join(" · ")}</li>)}
        </ol>
      )}
      <form className="c4-libella-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addLibella(cards, { title, note, bearer, staff, wood, notch: notchNo, vane: vaneNo, tags });
        if (next.length === cards.length) return;
        store(next);
        setTitle("");
        setNote("");
        setTags("");
      }}>
        <input className="c4-field" aria-label={v4("lblEdit")} aria-required={false} value={title} onChange={(event) => setTitle(event.target.value)} placeholder={v4("lblEdit")} disabled={viewer} />
        <input className="c4-field" aria-label={v4("lblNote")} aria-required={false} value={note} onChange={(event) => setNote(event.target.value)} placeholder={v4("lblNote")} disabled={viewer} />
        <input className="c4-field" aria-label={v4("lblBearer")} aria-required={false} value={bearer} onChange={(event) => setBearer(event.target.value)} placeholder={v4("lblBearer")} disabled={viewer} />
        <select className="c4-select" aria-label={v4("lblDesk")} value={staff} onChange={(event) => setStaff(event.target.value)} disabled={viewer}>
          <option value="">{v4("lblBlankBoard")}</option>
          {LBL_STAVES.map((item) => <option key={item} value={item}>{staffLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("lblWood")} value={wood} onChange={(event) => setWood(event.target.value)} disabled={viewer}>
          <option value="">{v4("lblWood")}</option>
          {WOODS.map((item) => <option key={item} value={item}>{woodLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("lblNotch")} value={notchNo} onChange={(event) => setNotchNo(event.target.value)} disabled={viewer}>
          <option value="">{v4("lblNotch")}</option>
          {NOTCHES.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("lblVane")} value={vaneNo} onChange={(event) => setVaneNo(event.target.value)} disabled={viewer}>
          <option value="">{v4("lblVane")}</option>
          {VANES.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <input className="c4-field" aria-label={v4("lblTag")} aria-required={false} value={tags} onChange={(event) => setTags(event.target.value)} placeholder={v4("lblTag")} disabled={viewer} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("lblAdd")}</button>
      </form>
      <form className="c4-libella-views" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addLibellaView(views, { id: `v${Date.now().toString(36)}`, name: viewName, tray, query, bearer: bearerFilter, wood: woodFilter, staff: staffFilter, notch: notchFilter, vane: vaneFilter });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <input className="c4-field" aria-label={v4("lblViewName")} aria-required={false} value={viewName} onChange={(event) => setViewName(event.target.value)} placeholder={v4("lblViewName")} disabled={viewer} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("lblSaveView")}</button>
        {views.map((view) => (
          <span key={view.id} className="c4-libella-view">
            <button type="button" className="c4-chip" onClick={() => { setTray(view.tray); setQuery(view.query); setBearerFilter(view.bearer); setWoodFilter(view.wood); setStaffFilter(view.staff); setNotchFilter(view.notch); setVaneFilter(view.vane); }}>{v4("lblApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropLibellaView(views, view.id))}>{v4("lblDrop")}</button>
          </span>
        ))}
      </form>
      <div className="c4-libella-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkLibellaSighted(cards, picked))}>{v4("lblBulkLaid")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkLibellaOak(cards, picked))}>{v4("lblBulkOak")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkLibellaVault(cards, picked))}>{v4("lblBulkCrypt")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkLibellaTag(cards, picked))}>{v4("lblBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("libella-rules.csv", libellaCsv(shown, desk))}>{v4("lblCsv")}</button>
      </div>
      <p className="c4-libella-keys">{v4("lblKeys")} j k / p o u d m c a s v x</p>
      {!shown.length && <p className="c4-pay-empty">{v4("lblEmpty")}</p>}
      <ul className="c4-libella-list" data-density={density}>
        {shown.map((card) => {
          const auditKey = AUDIT_KEY[card.audit];
          return (
            <li key={card.id} className="c4-libella-card" data-on={focused?.id === card.id ? "1" : "0"} data-staff={card.staff || "blank"} data-late={lateLibella(card, desk) ? "1" : "0"} data-idle={idleLibella(card) ? "1" : "0"} data-brisk={briskLibella(card) ? "1" : "0"} data-resting={restingLibella(card) ? "1" : "0"} data-overdue={overdueLibella(card) ? "1" : "0"} data-inner={libellaInner(card.staff) ? "1" : "0"} data-outer={libellaOuter(card.staff) ? "1" : "0"}>
              <label className="c4-libella-pick">
                <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
              </label>
              <div>
                <input className="c4-field" aria-label={v4("lblEdit")} aria-required={false} defaultValue={card.title} disabled={viewer} onBlur={(event) => store(editLibella(cards, card.id, event.target.value))} />
                <input className="c4-field" aria-label={v4("lblNote")} aria-required={false} defaultValue={card.note} disabled={viewer} onBlur={(event) => store(editLibellaNote(cards, card.id, event.target.value))} />
                <p className="c4-libella-meta">{card.bearer || "—"} · {staffLabel(v4, card.staff)} · {woodLabel(v4, card.wood)} · {card.notch ?? "—"} · {card.vane} · {card.tags.join(" ") || "—"}</p>
                {auditKey && <p className="c4-libella-audit">{v4(auditKey)}</p>}
              </div>
              <div className="c4-libella-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setLibellaSighted(cards, card.id, !card.sighted))}>{card.sighted ? v4("lblClear") : v4("lblLay")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setLibellaWood(cards, card.id, suggested))}>{v4("lblSuggest")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setLibellaRack(cards, card.id, !card.racked))}>{card.racked ? v4("lblUnrack") : v4("lblRackIt")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setLibellaVault(cards, card.id, !card.cased))}>{card.cased ? v4("lblUncase") : v4("lblCaseIt")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setLibellaStar(cards, card.id, !card.starred))}>{card.starred ? v4("lblUnstar") : v4("lblStar")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addLibellaTag(cards, card.id, "c"))}>{v4("lblTag")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(liftNotchFocused(cards, card.id))}>{v4("lblLift")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerNotchFocused(cards, card.id))}>{v4("lblLower")}</button>
                <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(libellaCopy(card))}>{v4("lblCopy")}</button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

type SigilUser = { id?: string; name?: string | null; accountLoginId?: boolean | string | number | null };

export function SigilPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: SigilUser[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<SigilShape>("all");
  const [review, setReview] = useState<SigilReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): SigilRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      sigil: { accountLoginId: textField(row.accountLoginId) } satisfies SigilValue,
    };
  }).filter((row): row is SigilRow => Boolean(row));
  const present = presentSigilLanes(rows);
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
    const next = readHiddenSigils(readJson(SIG_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(SIG_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedSigils(readJson(SIG_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(SIG_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleSigilLanes(present, hidden, showHidden);
  const shown = visibleSigils(rows, lanes.includes(lane) || lane === "all" ? lane : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = sigilLane(row.sigil);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = sigilLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingSigil(rows);
  const leadHue = leadingSigilHue(rows);
  const whole = rows.filter((row) => sigilLane(row.sigil)).length;
  const share = sigilShare(laneSigilCount(rows, "house"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("sigil-lanes.csv", sigilLanesCsv(rows));
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
    writeJson(SIG_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(SIG_REVIEW_KEY, next);
  }

  return (
    <section className="c4-sigil" aria-label={v4("sigTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-sigil-mast">
        <p className="c4-sigil-seal" data-logo="mono">{v4("sigLogo")}</p>
        <div>
          <p className="c4-sigil-kicker">{v4("sigSub")}</p>
          <h2 className="c4-title">{v4("sigTitle")}</h2>
        </div>
        <p className="c4-sigil-count">{shown.length}</p>
      </header>
      <p className="c4-sigil-links">
        <Link href={crmv4Href(base, "lbl")}>{v4("lblTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("sigCustomer")}</Link>
      </p>
      <p className="c4-sigil-hint">{v4("sigHint")}</p>
      {viewer && <p className="c4-sigil-note">{v4("sigViewer")}</p>}
      <p className="c4-sigil-meta">{v4("sigLead")} {laneLabel(v4, lead)} · {v4("sigToneLead")} {hueLabel(v4, leadHue)} · {v4("sigShare")} {share}</p>
      <div className="c4-sigil-chart" aria-label={v4("sigChart")}>
        {lines.map((line) => (
          <button key={line.lane} type="button" className="c4-sigil-column" data-on={lane === line.lane ? "1" : "0"} data-lane={line.lane} onClick={() => setLane(lane === line.lane ? "all" : line.lane)}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-sigil-tools">
        <input ref={searchRef} className="c4-field c4-sigil-search" aria-label={v4("sigSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("sigSearch")} />
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("sigShow")}</button>
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{v4(item === "all" ? "sigAll" : item === "reviewed" ? "sigReviewed" : "sigFresh")}</button>
        ))}
        {(["all", "champagne", "ivory", "graphite"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("sigAll") : hueLabel(v4, item)}</button>
        ))}
        {(Object.keys(SHAPE_KEY) as SigilShape[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" onClick={() => storeHidden(toggleSigil(hidden, item))}>{hidden.includes(item) ? v4("sigShow") : v4("sigHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-sigil-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkSigilReview(reviewed, picked, true))}>{v4("sigBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkSigilReview(reviewed, picked, false))}>{v4("sigBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("sigil-lanes.csv", sigilLanesCsv(rows))}>{v4("sigCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("sigil-rows.csv", sigilRowsCsv(shown, reviewed))}>{v4("sigRowCsv")}</button>
      </div>
      {queue.loading && !rows.length && <p className="c4-meta">{v4("sigLoading")}</p>}
      {queue.error && <p className="c4-meta">{v4("sigFailed")}</p>}
      {!queue.loading && !queue.error && !rows.length && <p className="c4-pay-empty">{v4("sigEmpty")}</p>}
      <ul className="c4-sigil-list">
        {shown.map((row) => {
          const name = sigilCopy(row.sigil);
          const tone = sigilHue(row.sigil);
          return (
            <li key={row.id} className="c4-sigil-card" data-lane={sigilLane(row.sigil) || "open"} data-hue={tone || "none"} data-house={sigilHouseSafe(row.sigil)} data-open={sigilOpen(row.sigil) ? "1" : "0"} data-even={sigilEven(row.sigil) ? "1" : "0"} data-digit={sigilDigit(row.sigil) ? "1" : "0"} data-letter={sigilLetter(row.sigil) ? "1" : "0"} data-mixed={sigilMixed(row.sigil) ? "1" : "0"} data-upper={sigilUpper(row.sigil) ? "1" : "0"} data-lower={sigilLower(row.sigil) ? "1" : "0"} data-space={sigilSpace(row.sigil) ? "1" : "0"} data-vowel={sigilVowel(row.sigil) ? "1" : "0"} data-tail={sigilTail(row.sigil) ? "1" : "0"} data-first={sigilFirst(row.sigil) ? "1" : "0"} data-cased={sigilHeld(row.sigil) ? "1" : "0"} data-hyphen={sigilHyphen(row.sigil) ? "1" : "0"} data-period={sigilPeriod(row.sigil) ? "1" : "0"} data-capital={sigilCapital(row.sigil) ? "1" : "0"}>
              <label className="c4-sigil-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-sigil-meta">{name || v4("sigOpen")} · {sigilStamp(row.sigil) || "—"} · {sigilFamily(row.sigil) || "—"} · {sigilLength(row.sigil) ?? "—"} · {laneLabel(v4, sigilLane(row.sigil))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-sigil-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleSigilReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("sigReviewed") : v4("sigReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const text = sigilCopy(row.sigil); if (!text) return; navigator.clipboard?.writeText(text); setCopied(row.id); }}>{copied === row.id ? v4("sigCopied") : v4("sigCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("sigCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function sigilHouseSafe(raw: SigilValue): string {
  return sigilLane(raw) === "house" ? "1" : "0";
}
