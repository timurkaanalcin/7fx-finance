"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  LGN_KEY,
  LGN_REVIEW_KEY,
  VLV_DENSITY_KEY,
  VLV_KEY,
  VLV_VIEW_KEY,
  VOLVELLE_DISKS,
  addVolvelle,
  addVolvelleTag,
  addVolvelleView,
  briskVolvelle,
  bulkLoginReview,
  bulkVolvelleGold,
  bulkVolvelleLog,
  bulkVolvelleStow,
  bulkVolvelleTag,
  busiestKeeper,
  loginDormant,
  loginCopy,
  loginDeep,
  loginEven,
  loginGap,
  loginHue,
  loginLane,
  loginLanes,
  loginLanesCsv,
  loginLeap,
  loginMark,
  loginQuarter,
  loginQuiet,
  loginRowsCsv,
  loginShare,
  loginSpace,
  loginStamp,
  loginStep,
  loginTail,
  loginToday,
  loginTwin,
  loginFresh,
  cycleInk,
  dropVolvelleView,
  editVolvelle,
  editVolvelleNote,
  fairKeeper,
  firmDisk,
  idleVolvelle,
  laneLoginCount,
  lateVolvelle,
  leadingLogin,
  leadingLoginHue,
  liftRadiusFocused,
  lockVolvelleFocused,
  volvelleBars,
  volvelleKeepers,
  volvelleCopy,
  volvelleCounts,
  volvelleCsv,
  volvelleDensity,
  volvelleTimeline,
  logVolvelleFocused,
  lowerPointerFocused,
  lowerRadiusFocused,
  moveVolvelleFocus,
  overdueVolvelle,
  presentLoginLanes,
  raisePointerFocused,
  readHiddenLogin,
  readVolvelleViews,
  readVolvelles,
  readReviewedLogin,
  reminderVolvelles,
  restingVolvelle,
  setVolvelleLock,
  setVolvelleLogged,
  setVolvelleStar,
  setVolvelleInk,
  setVolvelleStow,
  sharedLoginCount,
  softDisk,
  sortVolvelles,
  starVolvelleFocused,
  inkFocused,
  suggestDisk,
  suggestVolvelleInk,
  suggestRadius,
  tagVolvelleFocused,
  toggleLogin,
  toggleLoginReview,
  visibleLogin,
  visibleLoginLanes,
  visibleVolvelles,
  type LoginReview,
  type LoginRow,
  type LoginShape,
  type LoginValue,
  type Volvelle,
  type VolvelleDensity,
  type VolvelleSort,
  type VolvelleTray,
  type VolvelleView,
} from "@/lib/crmv4/round289";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

type TouchedRow = { id?: string; name?: string | null; lastLoginAt?: string | null };

const INKS = ["SOOT", "GALL", "GOLD"] as const;
const RADII = ["3", "6", "9"] as const;
const POINTERS = ["1", "2", "4"] as const;
const SHAPES: LoginShape[] = ["all", "fresh", "dormant", "quiet", "today", "quarter", "even", "leap", "gap", "deep", "twin", "tail", "mark", "space", "week", "month", "season"];

const BED_KEY: Record<string, CrmV4CopyKey> = {
  linen: "vlvOak",
  parchment: "vlvSlate",
  board: "vlvSand",
  horn: "vlvMoss",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "vlvAuditSave",
  edit: "vlvAuditEdit",
  note: "vlvAuditNote",
  ink: "vlvAuditInk",
  log: "vlvAuditLog",
  unlog: "vlvAuditUnlog",
  lock: "vlvAuditLock",
  resume: "vlvAuditResume",
  stow: "vlvAuditStow",
  open: "vlvAuditOpen",
  tag: "vlvAuditTag",
  pointer: "vlvAuditPointer",
  radius: "vlvAuditRadius",
  lower: "vlvAuditLower",
  star: "vlvAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  fresh: "lgnFresh",
  week: "lgnWeek",
  month: "lgnMonth",
  season: "lgnSeason",
  dormant: "lgnDormant",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  ivory: "lgnIvory",
  graphite: "lgnGraphite",
  champagne: "lgnChampagne",
};

const SHAPE_KEY: Record<LoginShape, CrmV4CopyKey> = {
  all: "lgnShapeAll",
  fresh: "lgnShapeFresh",
  dormant: "lgnShapeDormant",
  quiet: "lgnShapeQuiet",
  today: "lgnShapeToday",
  quarter: "lgnShapeQuarter",
  even: "lgnShapeEven",
  leap: "lgnShapeLeap",
  gap: "lgnShapeGap",
  deep: "lgnShapeDeep",
  twin: "lgnShapeTwin",
  tail: "lgnShapeTail",
  mark: "lgnShapeMark",
  space: "lgnShapeSpace",
  week: "lgnShapeWeek",
  month: "lgnShapeMonth",
  season: "lgnShapeSeason",
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

function diskLabel(v4: V4, disk: string): string {
  const key = BED_KEY[disk];
  return key ? v4(key) : v4("vlvBlankDisk");
}

function inkLabel(v4: V4, ink: string): string {
  if (ink === "SOOT") return v4("vlvIron");
  if (ink === "GALL") return v4("vlvSteel");
  if (ink === "GOLD") return v4("vlvGilt");
  return v4("vlvAll");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("lgnUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("lgnUnmarked");
}

export function VolvelleLeaves({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Volvelle[]>([]);
  const [views, setViews] = useState<VolvelleView[]>([]);
  const [density, setDensity] = useState<VolvelleDensity>("wide");
  const [tray, setTray] = useState<VolvelleTray>("bench");
  const [query, setQuery] = useState("");
  const [keeperFilter, setKeeperFilter] = useState("");
  const [inkFilter, setInkFilter] = useState("all");
  const [diskFilter, setDiskFilter] = useState("all");
  const [radiusFilter, setRadiusFilter] = useState("all");
  const [pointerFilter, setPointerFilter] = useState("all");
  const [sort, setSort] = useState<VolvelleSort>("disk");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [keeper, setKeeper] = useState("");
  const [disk, setDisk] = useState("");
  const [ink, setInk] = useState("");
  const [radiusNo, setRadiusNo] = useState("");
  const [pointerNo, setPointerNo] = useState("");
  const [tags, setTags] = useState("");
  const [viewName, setViewName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focusAt, setFocusAt] = useState(0);
  const [desk, setDesk] = useState("linen");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readVolvelles(readJson(VLV_KEY, [])));
    setViews(readVolvelleViews(readJson(VLV_VIEW_KEY, [])));
    setDensity(volvelleDensity(readJson(VLV_DENSITY_KEY, "wide")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Volvelle[]) {
    setCards(next);
    writeJson(VLV_KEY, next);
  }
  function storeViews(next: VolvelleView[]) {
    setViews(next);
    writeJson(VLV_VIEW_KEY, next);
  }
  function storeDensity(next: VolvelleDensity) {
    setDensity(next);
    writeJson(VLV_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortVolvelles(visibleVolvelles(cards, tray, query, keeperFilter, inkFilter, diskFilter, radiusFilter, pointerFilter), sort),
    [cards, tray, query, keeperFilter, inkFilter, diskFilter, radiusFilter, pointerFilter, sort],
  );
  const counts = volvelleCounts(cards, shown, desk);
  const bars = volvelleBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = volvelleTimeline(cards);
  const keepers = volvelleKeepers(cards);
  const ids = shown.map((card) => card.id);
  const suggested = suggestVolvelleInk(cards);
  const fair = fairKeeper(cards, keepers.join(","));
  const busy = busiestKeeper(cards);
  const reminders = reminderVolvelles(cards);
  const radiusHint = suggestRadius(cards, clock);
  const diskHint = suggestDisk(clock);
  const focused = shown[focusAt];

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setTitle("");
        setNote("");
        setKeeper("");
        setDisk("");
        setInk("");
        setRadiusNo("");
        setPointerNo("");
        setTags("");
        return;
      }
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocusAt((index) => moveVolvelleFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocusAt((index) => moveVolvelleFocus(index, shown.length, -1));
        return;
      }
      if (viewer) return;
      const id = shown[focusAt]?.id || "";
      if (event.key === "q" || event.key === "Q") {
        event.preventDefault();
        store(liftRadiusFocused(cards, id));
        return;
      }
      if (event.key === "v" || event.key === "V") {
        event.preventDefault();
        store(setVolvelleStow(cards, id, !shown[focusAt]?.stowed));
        return;
      }
      if (event.key === "g" || event.key === "G") {
        event.preventDefault();
        store(inkFocused(cards, id));
        return;
      }
      if (event.key === "l" || event.key === "L") {
        event.preventDefault();
        store(lockVolvelleFocused(cards, id));
        return;
      }
      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        store(logVolvelleFocused(cards, id));
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("volvelle-leaves.csv", volvelleCsv(shown, desk));
        return;
      }
      if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        store(starVolvelleFocused(cards, id));
        return;
      }
      if (event.key === "u" || event.key === "U") {
        event.preventDefault();
        store(raisePointerFocused(cards, id));
        return;
      }
      if (event.key === "y" || event.key === "Y") {
        event.preventDefault();
        store(lowerPointerFocused(cards, id));
        return;
      }
      if (event.key === "f" || event.key === "F") {
        event.preventDefault();
        store(lowerRadiusFocused(cards, id));
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
    <section className="c4-volvelle" aria-label={v4("vlvTitle")} data-cards="1" data-desk={tray} data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-volvelle-mast">
        <p className="c4-volvelle-seal" data-logo="mono">{v4("vlvLogo")}</p>
        <div>
          <p className="c4-volvelle-kicker">{v4("vlvSub")}</p>
          <h2 className="c4-title">{v4("vlvTitle")}</h2>
        </div>
        <ol className="c4-volvelle-index" aria-label={v4("vlvTitle")}>
          <li data-tone="gold">{v4("vlvGilt")}</li>
          <li data-tone="ink">{v4("vlvSteel")}</li>
          <li data-tone="ivory">{v4("vlvIron")}</li>
        </ol>
      </header>
      <p className="c4-volvelle-links">
        <Link href={crmv4Href(base, "lgn")}>{v4("lgnTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("vlvCustomers")}</Link>
        <Link href={crmv4Href(base, "callpack")}>{v4("cpFolioKicker")}</Link>
      </p>
      <p className="c4-volvelle-hint">{v4("vlvHint")}</p>
      {viewer && <p className="c4-volvelle-note">{v4("vlvViewer")}</p>}
      {counts.overdue > 0 && <p className="c4-volvelle-notice" role="status">{v4("vlvOverdue")} {counts.overdue}</p>}
      <ol className="c4-volvelle-dials" aria-label={v4("vlvChart")}>
        <li><span>{v4("vlvTable")}</span><strong>{counts.table}</strong></li>
        <li><span>{v4("vlvCabinet")}</span><strong>{counts.cabinet}</strong></li>
        <li><span>{v4("vlvCellar")}</span><strong>{counts.cellar}</strong></li>
        <li><span>{v4("vlvOverdue")}</span><strong>{counts.overdue}</strong></li>
        <li><span>{v4("vlvIdle")}</span><strong>{counts.idle}</strong></li>
        <li><span>{v4("vlvBrisk")}</span><strong>{counts.brisk}</strong></li>
        <li><span>{v4("vlvFair")}</span><strong>{fair || "·"}</strong></li>
        <li><span>{v4("vlvBusy")}</span><strong>{busy || "·"}</strong></li>
      </ol>
      <div className="c4-volvelle-chart" aria-label={v4("vlvChart")}>
        {bars.map((bar) => (
          <button key={bar.disk} type="button" className="c4-volvelle-column" data-on={diskFilter === bar.disk ? "1" : "0"} data-disk={bar.disk} onClick={() => setDiskFilter(diskFilter === bar.disk ? "all" : bar.disk)}>
            <i style={{ height: `${Math.max(8, Math.round((bar.count / peak) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{diskLabel(v4, bar.disk)}</span>
          </button>
        ))}
      </div>
      <div className="c4-volvelle-tools">
        <input ref={searchRef} className="c4-field c4-volvelle-search" aria-label={v4("vlvSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("vlvSearch")} />
        {(["bench", "drawer", "chest"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "bench" ? "vlvTable" : item === "drawer" ? "vlvCabinet" : "vlvCellar")}</button>
        ))}
        {(["all", "firm", "soft", ...VOLVELLE_DISKS] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={diskFilter === item ? "1" : "0"} onClick={() => setDiskFilter(item)}>{item === "all" ? v4("vlvAll") : item === "firm" ? v4("vlvFirm") : item === "soft" ? v4("vlvSoft") : diskLabel(v4, item)}</button>
        ))}
        {["all", ...INKS].map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={inkFilter === item ? "1" : "0"} onClick={() => setInkFilter(item)}>{item === "all" ? v4("vlvInk") : inkLabel(v4, item)}</button>
        ))}
        {["all", ...RADII].map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={radiusFilter === item ? "1" : "0"} onClick={() => setRadiusFilter(item)}>{item === "all" ? v4("vlvRadius") : item}</button>
        ))}
        {["all", ...POINTERS].map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={pointerFilter === item ? "1" : "0"} onClick={() => setPointerFilter(item)}>{item === "all" ? v4("vlvPointer") : item}</button>
        ))}
        <button type="button" className="c4-chip" data-on={sort === "keeper" ? "1" : "0"} onClick={() => setSort(sort === "disk" ? "keeper" : "disk")}>{sort === "disk" ? v4("vlvSortDisk") : v4("vlvSortKeeper")}</button>
        <button type="button" className="c4-chip" data-on={density === "narrow" ? "1" : "0"} onClick={() => storeDensity(density === "wide" ? "narrow" : "wide")}>{density === "wide" ? v4("vlvWide") : v4("vlvNarrow")}</button>
        <button type="button" className="c4-btn" onClick={() => download("volvelle-leaves.csv", volvelleCsv(shown, desk))}>{v4("vlvCsv")}</button>
      </div>
      <div className="c4-volvelle-tools" role="group" aria-label={v4("vlvDesk")}>
        {VOLVELLE_DISKS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={desk === item ? "1" : "0"} onClick={() => setDesk(item)}>{v4("vlvDesk")} {diskLabel(v4, item)}</button>
        ))}
        <span className="c4-volvelle-meta">{v4("vlvSuggest")} {inkLabel(v4, suggested)} · {radiusHint} · {diskLabel(v4, diskHint)}</span>
      </div>
      <form className="c4-volvelle-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addVolvelle(cards, { title, note, keeper, disk, ink: ink || suggested, radius: radiusNo, pointer: pointerNo, tags });
        if (next.length === cards.length) return;
        store(next);
        setTitle("");
        setNote("");
        setTags("");
      }}>
        <input className="c4-field" aria-label={v4("vlvEdit")} aria-required={false} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} placeholder={v4("vlvTitle")} />
        <input className="c4-field" aria-label={v4("vlvNote")} aria-required={false} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} placeholder={v4("vlvNote")} />
        <input className="c4-field" aria-label={v4("vlvKeeper")} aria-required={false} value={keeper} disabled={viewer} onChange={(event) => setKeeper(event.target.value)} placeholder={v4("vlvKeeper")} />
        <select className="c4-select" aria-label={v4("vlvDisk")} value={disk} disabled={viewer} onChange={(event) => setDisk(event.target.value)}>
          <option value="">{v4("vlvBlankDisk")}</option>
          {VOLVELLE_DISKS.map((item) => <option key={item} value={item}>{diskLabel(v4, item)}</option>)}
        </select>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("vlvAdd")}</button>
      </form>
      <form className="c4-volvelle-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addVolvelleView(views, { id: `v${Date.now().toString(36)}`, name: viewName, tray, query, keeper: keeperFilter, ink: inkFilter, disk: diskFilter, radius: radiusFilter, pointer: pointerFilter });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <input className="c4-field" aria-label={v4("vlvViewName")} aria-required={false} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} placeholder={v4("vlvViewName")} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("vlvSaveView")}</button>
      </form>
      <ul className="c4-volvelle-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setKeeperFilter(view.keeper); setInkFilter(view.ink); setDiskFilter(view.disk); setRadiusFilter(view.radius); setPointerFilter(view.pointer); }}>{v4("vlvApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropVolvelleView(views, view.id))}>{v4("vlvDrop")}</button>
          </li>
        ))}
      </ul>
      {picked.length > 0 && (
        <div className="c4-volvelle-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkVolvelleGold(cards, picked))}>{v4("vlvBulkGilt")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkVolvelleLog(cards, picked))}>{v4("vlvBulkLog")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkVolvelleStow(cards, picked))}>{v4("vlvBulkStow")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkVolvelleTag(cards, picked))}>{v4("vlvBulkTag")}</button>
        </div>
      )}
      <p className="c4-volvelle-meta">{v4("vlvKeys")} · j k n l g v s f q u y x /</p>
      {timeline.length > 0 && (
        <ol className="c4-volvelle-time" aria-label={v4("vlvTimeline")}>
          {timeline.map((lane) => (
            <li key={lane.radius}><span>{v4("vlvRadius")} {lane.radius}</span><strong>{lane.titles.join(" · ")}</strong></li>
          ))}
        </ol>
      )}
      {reminders.length > 0 && <p className="c4-volvelle-meta">{v4("vlvRemind")} {reminders.join(" · ")}</p>}
      {!shown.length && <p className="c4-volvelle-empty">{v4("vlvEmpty")}</p>}
      <ol className="c4-volvelle-board">
        {shown.map((card, index) => {
          const on = index === focusAt;
          return (
            <li key={card.id} className="c4-volvelle-card" data-on={on ? "1" : "0"} data-overdue={overdueVolvelle(card) ? "1" : "0"} data-idle={idleVolvelle(card) ? "1" : "0"} data-brisk={briskVolvelle(card) ? "1" : "0"} data-resting={restingVolvelle(card) ? "1" : "0"} data-late={lateVolvelle(card, desk) ? "1" : "0"} data-soft={softDisk(card.disk) ? "1" : "0"} data-firm={firmDisk(card.disk) ? "1" : "0"} data-star={card.flagged ? "1" : "0"}>
              <label className="c4-volvelle-pick"><input type="checkbox" checked={picked.includes(card.id)} aria-label={card.title} onChange={() => setPicked((current) => (current.includes(card.id) ? current.filter((item) => item !== card.id) : [...current, card.id]))} /></label>
              <div>
                {on && !viewer ? (
                  <input className="c4-field" aria-label={v4("vlvEdit")} aria-required={false} value={card.title} onChange={(event) => store(editVolvelle(cards, card.id, event.target.value))} />
                ) : (
                  <strong>{card.title}</strong>
                )}
                <p className="c4-volvelle-meta">{card.keeper || v4("vlvKeeper")} · {diskLabel(v4, card.disk)} · {inkLabel(v4, card.ink)} · {card.radius ?? "·"} · {v4("vlvPointer")} {card.pointer}{card.tags.length ? ` · ${card.tags.join("")}` : ""}{card.audit ? ` · ${AUDIT_KEY[card.audit] ? v4(AUDIT_KEY[card.audit]) : card.audit}` : ""}</p>
                {on && !viewer ? (
                  <input className="c4-field" aria-label={v4("vlvNote")} aria-required={false} value={card.note} onChange={(event) => store(editVolvelleNote(cards, card.id, event.target.value))} />
                ) : (
                  card.note && <p className="c4-volvelle-meta">{card.note}</p>
                )}
                <div className="c4-volvelle-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setVolvelleLogged(cards, card.id, !card.logged))}>{card.logged ? v4("vlvUnlog") : v4("vlvLog")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setVolvelleLock(cards, card.id, !card.locked))}>{card.locked ? v4("vlvUnlock") : v4("vlvLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setVolvelleStow(cards, card.id, !card.stowed))}>{card.stowed ? v4("vlvUnstow") : v4("vlvStow")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setVolvelleStar(cards, card.id, !card.flagged))}>{card.flagged ? v4("vlvUnstar") : v4("vlvStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setVolvelleInk(cards, card.id, cycleInk(card.ink)))}>{v4("vlvInk")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(liftRadiusFocused(cards, card.id))}>{v4("vlvLift")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerRadiusFocused(cards, card.id))}>{v4("vlvLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raisePointerFocused(cards, card.id))}>{v4("vlvPointer")}+</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerPointerFocused(cards, card.id))}>{v4("vlvPointer")}−</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addVolvelleTag(cards, card.id, "a"))}>{v4("vlvTag")} a</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(tagVolvelleFocused(cards, card.id))}>{v4("vlvTag")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(volvelleCopy(card)); }}>{v4("lgnCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="c4-volvelle-meta">{v4("vlvMatched")} {counts.matched} · {ids.length}</p>
    </section>
  );
}

export function LoginPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: TouchedRow[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<LoginShape>("all");
  const [review, setReview] = useState<LoginReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [focusAt, setFocusAt] = useState(0);
  const [copied, setCopied] = useState("");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const now = Date.now();

  useEffect(() => {
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  const rows = useMemo<LoginRow[]>(() => {
    return (queue.data?.users || []).map((row, index) => ({
      id: textField(row.id) || `c${index}`,
      label: textField(row.name),
      signed: { lastLoginAt: textField(row.lastLoginAt) } satisfies LoginValue,
    }));
  }, [queue.data]);

  useEffect(() => {
    const ids = rows.map((row) => row.id);
    const clock = Date.now();
    setHidden(readHiddenLogin(readJson(LGN_KEY, []), presentLoginLanes(rows, clock)));
    setReviewed(readReviewedLogin(readJson(LGN_REVIEW_KEY, []), ids));
  }, [rows]);

  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(LGN_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(LGN_REVIEW_KEY, next);
  }

  const lanes = visibleLoginLanes(presentLoginLanes(rows, now), hidden, showHidden);
  const shown = visibleLogin(rows, lane, hue, query, review, reviewed, shape, now).filter((row) => !hidden.includes(loginLane(row.signed, now)) || showHidden);
  const bars = loginLanes(rows, now);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const lead = leadingLogin(rows, now);
  const leadHue = leadingLoginHue(rows, now);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocusAt((index) => moveVolvelleFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocusAt((index) => moveVolvelleFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "m" || event.key === "M") {
        event.preventDefault();
        if (viewer) return;
        const id = shown[focusAt]?.id;
        if (id) storeReviewed(toggleLoginReview(reviewed, id));
        return;
      }
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focusAt, reviewed, shown, viewer]);

  return (
    <section className="c4-login" aria-label={v4("lgnTitle")} data-plates="1" data-names={rows.length} data-role={role}>
      <header className="c4-login-mast">
        <p className="c4-login-seal" data-logo="mono">{v4("lgnLogo")}</p>
        <div>
          <p className="c4-login-kicker">{v4("lgnSub")}</p>
          <h2 className="c4-title">{v4("lgnTitle")}</h2>
        </div>
      </header>
      <ol className="c4-login-index" aria-label={v4("lgnTitle")}>
        <li data-tone="gold">{v4("lgnFresh")}</li>
        <li data-tone="ink">{v4("lgnDormant")}</li>
        <li data-tone="ivory">{v4("lgnWeek")}</li>
        <li data-tone="mist">{v4("lgnMonth")}</li>
        <li data-tone="line">{v4("lgnSeason")}</li>
      </ol>
      <p className="c4-login-links">
        <Link href={crmv4Href(base, "vlv")}>{v4("vlvTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("vlvCustomers")}</Link>
        <Link href={crmv4Href(base, "markbar")}>{v4("mbRailKicker")}</Link>
      </p>
      <p className="c4-login-hint">{v4("lgnHint")}</p>
      {viewer && <p className="c4-login-note">{v4("lgnViewer")}</p>}
      {queue.loading && <p className="c4-login-meta">{v4("lgnEmpty")}</p>}
      {queue.error && <p className="c4-login-meta">{queue.error}</p>}
      <ul className="c4-login-kpis" aria-label={v4("lgnRules")}>
        <li><span>{v4("lgnLead")}</span><strong>{lead ? laneLabel(v4, lead) : v4("lgnUnmarked")}</strong></li>
        <li><span>{v4("lgnToneLead")}</span><strong>{leadHue ? hueLabel(v4, leadHue) : v4("lgnUnmarked")}</strong></li>
        <li><span>{v4("lgnFresh")}</span><strong>{laneLoginCount(rows, "fresh", now)}</strong></li>
        <li><span>{v4("lgnDormant")}</span><strong>{laneLoginCount(rows, "dormant", now)}</strong></li>
        <li><span>{v4("lgnShare")}</span><strong>{loginShare(laneLoginCount(rows, "dormant", now), Math.max(1, rows.length))}%</strong></li>
        <li><span>{v4("lgnQuiet")}</span><strong>{rows.filter((row) => loginQuiet(row.signed)).length}</strong></li>
        <li><span>{v4("lgnToday")}</span><strong>{rows.filter((row) => loginToday(row.signed, now)).length}</strong></li>
        <li><span>{v4("lgnTwin")}</span><strong>{sharedLoginCount(rows, now)}</strong></li>
      </ul>
      <div className="c4-login-chart" aria-label={v4("lgnRules")}>
        {bars.map((bar) => (
          <button key={bar.lane} type="button" className="c4-login-column" data-on={lane === bar.lane ? "1" : "0"} data-lane={bar.lane} onClick={() => setLane(lane === bar.lane ? "all" : bar.lane)}>
            <i style={{ height: `${Math.max(12, Math.round((bar.count / maxBar) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{laneLabel(v4, bar.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-login-tools">
        <input ref={searchRef} className="c4-field c4-login-search" aria-label={v4("lgnSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("lgnSearch")} />
        {(["all", "ivory", "graphite", "champagne"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("lgnAll") : hueLabel(v4, item)}</button>
        ))}
        {SHAPES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{item === "all" ? v4("lgnAll") : item === "reviewed" ? v4("lgnReviewed") : v4("lgnFreshCut")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("lgnShow")}</button>
        <button type="button" className="c4-btn" onClick={() => download("login-lanes.csv", loginLanesCsv(rows, now))}>{v4("lgnCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("login-rows.csv", loginRowsCsv(rows, reviewed, now))}>{v4("lgnRowCsv")}</button>
      </div>
      <ul className="c4-login-lanes">
        {lanes.map((item) => (
          <li key={item}>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(toggleLogin(hidden, item))}>{hidden.includes(item) ? v4("lgnShow") : v4("lgnHide")} {laneLabel(v4, item)}</button>
          </li>
        ))}
      </ul>
      {picked.length > 0 && (
        <div className="c4-login-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkLoginReview(reviewed, picked, true))}>{v4("lgnBulkReview")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkLoginReview(reviewed, picked, false))}>{v4("lgnBulkClear")}</button>
        </div>
      )}
      {!shown.length && <p className="c4-login-empty">{v4("lgnEmpty")}</p>}
      <ol className="c4-login-board">
        {shown.map((row, index) => {
          const seen = reviewed.includes(row.id);
          return (
            <li key={row.id} className="c4-login-card" data-on={index === focusAt ? "1" : "0"} data-lane={loginLane(row.signed, now)} data-hue={loginHue(row.signed, now)} data-reviewed={seen ? "1" : "0"} data-warm={loginFresh(row.signed, now) ? "1" : "0"} data-cold={loginDormant(row.signed, now) ? "1" : "0"} data-today={loginToday(row.signed, now) ? "1" : "0"} data-quarter={loginQuarter(row.signed, now) ? "1" : "0"}>
              <p className="c4-login-stamp">{loginStamp(row.signed, now) || "·"}</p>
              <label className="c4-login-pick"><input type="checkbox" checked={picked.includes(row.id)} aria-label={row.label || row.id} onChange={() => setPicked((current) => (current.includes(row.id) ? current.filter((item) => item !== row.id) : [...current, row.id]))} /></label>
              <div>
                <strong>{row.label || v4("lgnUnmarked")}</strong>
                <p className="c4-login-meta">{laneLabel(v4, loginLane(row.signed, now))} · {hueLabel(v4, loginHue(row.signed, now))} · {v4("lgnStep")} {loginStep(row.signed, now)}{loginEven(row.signed, now) ? ` · ${v4("lgnEven")}` : ""}{loginLeap(row.signed, now) ? ` · ${v4("lgnLeap")}` : ""}{loginGap(row.signed, now) ? ` · ${v4("lgnGap")}` : ""}{loginDeep(row.signed, now) ? ` · ${v4("lgnDeep")}` : ""}{loginTwin(row.signed, now) ? ` · ${v4("lgnTwin")}` : ""}{loginTail(row.signed) ? ` · ${v4("lgnTail")}` : ""}{loginMark(row.signed) ? ` · ${v4("lgnMark")}` : ""}{loginSpace(row.signed) ? ` · ${v4("lgnSpace")}` : ""}{loginQuiet(row.signed) ? ` · ${v4("lgnQuiet")}` : ""}{loginQuarter(row.signed, now) ? ` · ${v4("lgnQuarter")}` : ""}</p>
                <div className="c4-login-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleLoginReview(reviewed, row.id))}>{seen ? v4("lgnReviewed") : v4("lgnReview")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(loginCopy(row.signed)); setCopied(row.id); }}>{copied === row.id ? v4("lgnCopied") : v4("lgnCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
