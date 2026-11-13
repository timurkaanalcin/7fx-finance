"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  KAMAL_MASTS,
  KAM_DENSITY_KEY,
  KAM_KEY,
  KAM_VIEW_KEY,
  DWB_KEY,
  DWB_REVIEW_KEY,
  addKamal,
  addKamalTag,
  addKamalView,
  kamalBars,
  kamalCopy,
  kamalCounts,
  kamalCsv,
  kamalDensity,
  kamalKeepers,
  kamalTimeline,
  briskKamal,
  bulkKamalChampagne,
  bulkKamalGilt,
  bulkKamalLog,
  bulkKamalStow,
  bulkKamalTag,
  bulkDeskReview,
  busiestKeeper,
  clashMastCount,
  cycleShade,
  dipKnot,
  dipKnotFocused,
  dropKamalView,
  editKamal,
  editKamalNote,
  fairKeeper,
  houseFinish,
  idleKamal,
  idleKamals,
  keenMast,
  laneDeskCount,
  lateKamal,
  leadingDesk,
  leadingDeskHue,
  liftKnot,
  liftKnotFocused,
  lockKamalFocused,
  logKamalFocused,
  lowerChip,
  lowerChipFocused,
  moveKamalFocus,
  neighborKamalCount,
  overdueKamal,
  presentDeskLanes,
  raiseChip,
  raiseChipFocused,
  readKamalViews,
  readKamals,
  readHiddenDesks,
  readReviewedDesks,
  reminderKamals,
  restingKamal,
  setKamalFinish,
  setKamalLock,
  setKamalLogged,
  setKamalStar,
  setKamalStow,
  sharedDeskCount,
  sortKamals,
  deskCap,
  deskCopy,
  deskEcho,
  deskHue,
  deskKnown,
  deskLane,
  deskLanes,
  deskLanesCsv,
  deskLeap,
  deskNotch,
  deskRowsCsv,
  deskShare,
  deskSlash,
  deskStamp,
  deskStep,
  deskTail,
  deskTwin,
  deskVowel,
  deskWide,
  deskWords,
  starKamalFocused,
  stillMast,
  suggestKnot,
  suggestFinish,
  suggestMast,
  tagKamalFocused,
  toggleDesk,
  toggleDeskReview,
  toneFocused,
  visibleKamals,
  visibleDeskLanes,
  visibleDesks,
  type KamalDensity,
  type KamalSort,
  type KamalTray,
  type KamalView,
  type KamalSight,
  type DeskReview,
  type DeskRow,
  type DeskShape,
  type DeskValue,
} from "@/lib/crmv4/round279";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const METALS = ["ivory", "graphite", "champagne"] as const;
const SHADES = ["sand", "soot", "gilt"] as const;
const KNOTS = ["5", "15", "45"] as const;
const CHIPS = ["2", "5", "8"] as const;

const MAST_KEY: Record<string, CrmV4CopyKey> = {
  fore: "kamFore",
  main: "kamMain",
  mizzen: "kamMizzen",
  jigger: "kamJigger",
  keen: "kamKeen",
  still: "kamStill",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "kamAuditSave",
  edit: "kamAuditEdit",
  note: "kamAuditNote",
  shade: "kamAuditShade",
  log: "kamAuditLog",
  unlog: "kamAuditUnlog",
  lock: "kamAuditLock",
  resume: "kamAuditResume",
  stow: "kamAuditStow",
  open: "kamAuditOpen",
  finish: "kamAuditFinish",
  tag: "kamAuditTag",
  chip: "kamAuditChip",
  knot: "kamAuditKnot",
  dip: "kamAuditDip",
  star: "kamAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  gallery: "dwbGallery",
  watch: "dwbWatch",
  house: "dwbHouse",
  berth: "dwbBerth",
  span: "dwbSpan",
  plain: "dwbPlain",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  ivory: "dwbIvory",
  graphite: "dwbGraphite",
  champagne: "dwbChampagne",
};

type NameRow = {
  id?: string;
  name?: string | null;
  desk?: string | null;
  code?: string | null;
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
  const node = event.target as HTMLElement | null;
  if (!node) return false;
  const tag = node.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || node.isContentEditable;
}

function textField(raw: unknown): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").trim();
}

function mastLabel(v4: V4, mast: string): string {
  const key = MAST_KEY[mast];
  return key ? v4(key) : v4("kamBlank");
}

function finishLabel(v4: V4, finish: string): string {
  if (finish === "IVORY") return v4("kamIvory");
  if (finish === "GRAPHITE") return v4("kamGraphite");
  if (finish === "CHAMPAGNE") return v4("kamChampagne");
  return v4("kamBlankFinish");
}

function shadeLabel(v4: V4, shade: string): string {
  if (shade === "sand") return v4("kamSand");
  if (shade === "soot") return v4("kamSoot");
  if (shade === "gilt") return v4("kamGilt");
  return v4("kamBlankShade");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("dwbUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("dwbUnmarked");
}

export function KamalSights({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<KamalSight[]>([]);
  const [views, setViews] = useState<KamalView[]>([]);
  const [density, setDensity] = useState<KamalDensity>("open");
  const [sheet, setSheet] = useState<"board" | "index">("board");
  const [tray, setTray] = useState<KamalTray>("deck");
  const [query, setQuery] = useState("");
  const [helmsmanFilter, setHelmsmanFilter] = useState("all");
  const [finishFilter, setFinishFilter] = useState("all");
  const [shadeFilter, setShadeFilter] = useState("all");
  const [mastFilter, setMastFilter] = useState("all");
  const [knotFilter, setKnotFilter] = useState("all");
  const [chipFilter, setChipFilter] = useState("all");
  const [houseOnly, setHouseOnly] = useState(false);
  const [keenOnly, setKeenOnly] = useState(false);
  const [stillOnly, setStillOnly] = useState(false);
  const [sort, setSort] = useState<KamalSort>("band");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [helmsman, setHelmsman] = useState("");
  const [mast, setMast] = useState("");
  const [finish, setFinish] = useState("");
  const [shade, setShade] = useState("");
  const [knotNo, setKnotNo] = useState("");
  const [chipNo, setChipNo] = useState("2");
  const [tags, setTags] = useState("");
  const [viewName, setViewName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focusAt, setFocusAt] = useState(0);
  const [copied, setCopied] = useState("");
  const [desk, setDesk] = useState("fore");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readKamals(readJson(KAM_KEY, [])));
    setViews(readKamalViews(readJson(KAM_VIEW_KEY, [])));
    setDensity(kamalDensity(readJson(KAM_DENSITY_KEY, "open")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: KamalSight[]) {
    setCards(next);
    writeJson(KAM_KEY, next);
  }
  function storeViews(next: KamalView[]) {
    setViews(next);
    writeJson(KAM_VIEW_KEY, next);
  }
  function storeDensity(next: KamalDensity) {
    setDensity(next);
    writeJson(KAM_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortKamals(visibleKamals(cards, tray, query, helmsmanFilter, finishFilter, shadeFilter, mastFilter, knotFilter, chipFilter, houseOnly, keenOnly, stillOnly), sort),
    [cards, tray, query, helmsmanFilter, finishFilter, shadeFilter, mastFilter, knotFilter, chipFilter, houseOnly, keenOnly, stillOnly, sort],
  );
  const counts = kamalCounts(cards, shown, desk);
  const bars = kamalBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = kamalTimeline(cards);
  const helmsmen = kamalKeepers(cards);
  const ids = shown.map((card) => card.id);
  const suggested = suggestFinish(cards);
  const fair = fairKeeper(cards, helmsmen.join(","));
  const busy = busiestKeeper(cards);
  const reminders = reminderKamals(cards);
  const idling = idleKamals(cards);
  const knotHint = suggestKnot(cards, clock);
  const mastHint = suggestMast(clock);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setTitle("");
        setNote("");
        setHelmsman("");
        setMast("");
        setFinish("");
        setShade("");
        setKnotNo("");
        setTags("");
        return;
      }
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocusAt((index) => moveKamalFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocusAt((index) => moveKamalFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        if (!viewer) store(logKamalFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "h" || event.key === "H") {
        event.preventDefault();
        if (!viewer) store(lockKamalFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "g" || event.key === "G") {
        event.preventDefault();
        if (!viewer) store(toneFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "l" || event.key === "L") {
        event.preventDefault();
        if (!viewer) store(liftKnotFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        if (!viewer) store(dipKnotFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        if (!viewer) store(tagKamalFocused(cards, ids, focusAt, "a"));
        return;
      }
      if (event.key === "w" || event.key === "W") {
        event.preventDefault();
        if (!viewer) store(starKamalFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "u" || event.key === "U") {
        event.preventDefault();
        if (!viewer) store(raiseChipFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "y" || event.key === "Y") {
        event.preventDefault();
        if (!viewer) store(lowerChipFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "b" || event.key === "B") {
        event.preventDefault();
        setSheet((value) => (value === "board" ? "index" : "board"));
        return;
      }
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shown.length, viewer, cards, ids, focusAt]);

  function togglePick(id: string) {
    setPicked((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function applyView(view: KamalView) {
    setTray(view.tray);
    setQuery(view.query);
    setHelmsmanFilter(view.helmsman || "all");
    setFinishFilter(view.finish);
    setShadeFilter(view.shade);
    setMastFilter(view.mast);
    setKnotFilter(view.knot);
    setChipFilter(view.chip);
  }

  return (
    <section className="c4-kamal" aria-label={v4("kamTitle")} data-cards="1" data-desk="latitude" data-role={role} data-density={density} data-sheet={sheet}>
      <header className="c4-kamal-mast">
        <p className="c4-kamal-seal" data-logo="mono">{v4("kamLogo")}</p>
        <div>
          <p className="c4-kamal-kicker">{v4("kamSub")}</p>
          <h2 className="c4-title">{v4("kamTitle")}</h2>
        </div>
        <ol className="c4-kamal-index" aria-label={v4("kamTitle")}>
          <li data-tone="gold">{v4("kamGilt")}</li>
          <li data-tone="ink">{v4("kamSoot")}</li>
          <li data-tone="ivory">{v4("kamSand")}</li>
        </ol>
      </header>
      <p className="c4-kamal-links">
        <Link href={crmv4Href(base, "dwb")}>{v4("dwbTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("kamCustomers")}</Link>
        <Link href={crmv4Href(base, "week")}>{v4("kamWeek")}</Link>
      </p>
      {viewer && <p className="c4-kamal-note">{v4("kamViewer")}</p>}
      <p className="c4-kamal-lead">{v4("kamKeys")}</p>
      <p className="c4-kamal-hint">{v4("kamHint")}</p>
      <p className="c4-kamal-notice" role="status">{v4("kamNotice")} {counts.overdue}</p>
      <ol className="c4-kamal-dials" aria-label={v4("kamChart")}>
        <li><span>{v4("kamDeck")}</span><strong>{counts.deck}</strong></li>
        <li><span>{v4("kamLocker")}</span><strong>{counts.locker}</strong></li>
        <li><span>{v4("kamBilge")}</span><strong>{counts.bilge}</strong></li>
        <li><span>{v4("kamLogged")}</span><strong>{counts.logged}</strong></li>
        <li><span>{v4("kamOverdue")}</span><strong>{counts.overdue}</strong></li>
        <li><span>{v4("kamEven")}</span><strong>{counts.even}</strong></li>
      </ol>
      <div className="c4-kamal-chart" aria-label={v4("kamBars")}>
        {bars.map((bar) => (
          <button key={bar.mast} type="button" className="c4-kamal-column" data-on={mastFilter === bar.mast ? "1" : "0"} onClick={() => setMastFilter(mastFilter === bar.mast ? "all" : bar.mast)}>
            <i style={{ height: `${Math.max(8, Math.round((bar.count / peak) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{mastLabel(v4, bar.mast)}</span>
          </button>
        ))}
      </div>
      <ol className="c4-kamal-time" aria-label={v4("kamIndex")}>
        {timeline.map((lane) => (
          <li key={lane.chip}><span>{lane.chip}</span><strong>{lane.titles.join(" · ")}</strong></li>
        ))}
      </ol>
      <form className="c4-kamal-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const id = `kam-${Date.now().toString(36)}`;
        store(addKamal(cards, { id, title, note, helmsman, mast, finish, shade, knot: knotNo, chip: chipNo, tags }));
        setTitle("");
        setNote("");
        setTags("");
      }}>
        <input className="c4-field" aria-label={v4("kamEdit")} aria-required={false} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} placeholder={v4("kamTitle")} />
        <input className="c4-field" aria-label={v4("kamNote")} aria-required={false} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} placeholder={v4("kamNote")} />
        <input className="c4-field" aria-label={v4("kamFair")} aria-required={false} value={helmsman} disabled={viewer} onChange={(event) => setHelmsman(event.target.value)} placeholder={v4("kamBlankKeeper")} />
        <select className="c4-field" aria-label={v4("kamMast")} value={mast} disabled={viewer} onChange={(event) => setMast(event.target.value)}>
          <option value="">{v4("kamBlankMast")}</option>
          {KAMAL_MASTS.map((item) => <option key={item} value={item}>{mastLabel(v4, item)}</option>)}
        </select>
        <select className="c4-field" aria-label={v4("kamFinish")} value={finish} disabled={viewer} onChange={(event) => setFinish(event.target.value)}>
          <option value="">{v4("kamBlankFinish")}</option>
          {METALS.map((item) => <option key={item} value={item}>{finishLabel(v4, item.toUpperCase())}</option>)}
        </select>
        <select className="c4-field" aria-label={v4("kamShade")} value={shade} disabled={viewer} onChange={(event) => setShade(event.target.value)}>
          <option value="">{v4("kamBlankShade")}</option>
          {SHADES.map((item) => <option key={item} value={item}>{shadeLabel(v4, item)}</option>)}
        </select>
        <select className="c4-field" aria-label={v4("kamKnot")} value={knotNo} disabled={viewer} onChange={(event) => setKnotNo(event.target.value)}>
          <option value="">{v4("kamBlankKnot")}</option>
          {KNOTS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-field" aria-label={v4("kamChip")} value={chipNo} disabled={viewer} onChange={(event) => setChipNo(event.target.value)}>
          {CHIPS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <input className="c4-field" aria-label={v4("kamTags")} aria-required={false} value={tags} disabled={viewer} onChange={(event) => setTags(event.target.value)} placeholder={v4("kamTags")} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("kamAdd")}</button>
      </form>
      <div className="c4-kamal-tools">
        <input ref={searchRef} className="c4-field c4-kamal-search" aria-label={v4("kamSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("kamSearch")} />
        {(["deck", "locker", "bilge"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{item === "deck" ? v4("kamDeck") : item === "locker" ? v4("kamLocker") : v4("kamBilge")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={density === "close" ? "1" : "0"} onClick={() => storeDensity(density === "close" ? "open" : "close")}>{v4("kamTight")}</button>
        <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((value) => !value)}>{v4("kamHouse")}</button>
        <button type="button" className="c4-chip" data-on={keenOnly ? "1" : "0"} onClick={() => setKeenOnly((value) => !value)}>{v4("kamKeen")}</button>
        <button type="button" className="c4-chip" data-on={stillOnly ? "1" : "0"} onClick={() => setStillOnly((value) => !value)}>{v4("kamStill")}</button>
        <select className="c4-field" aria-label={v4("kamFair")} value={helmsmanFilter} onChange={(event) => setHelmsmanFilter(event.target.value)}>
          <option value="all">{v4("kamAll")}</option>
          {helmsmen.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-field" aria-label={v4("kamFinish")} value={finishFilter} onChange={(event) => setFinishFilter(event.target.value)}>
          <option value="all">{v4("kamAll")}</option>
          {METALS.map((item) => <option key={item} value={item}>{finishLabel(v4, item.toUpperCase())}</option>)}
        </select>
        <select className="c4-field" aria-label={v4("kamShade")} value={shadeFilter} onChange={(event) => setShadeFilter(event.target.value)}>
          <option value="all">{v4("kamAll")}</option>
          {SHADES.map((item) => <option key={item} value={item}>{shadeLabel(v4, item)}</option>)}
        </select>
        <select className="c4-field" aria-label={v4("kamMast")} value={mastFilter} onChange={(event) => setMastFilter(event.target.value)}>
          <option value="all">{v4("kamAll")}</option>
          <option value="keen">{v4("kamKeen")}</option>
          <option value="still">{v4("kamStill")}</option>
          {KAMAL_MASTS.map((item) => <option key={item} value={item}>{mastLabel(v4, item)}</option>)}
        </select>
        <select className="c4-field" aria-label={v4("kamKnot")} value={knotFilter} onChange={(event) => setKnotFilter(event.target.value)}>
          <option value="all">{v4("kamAll")}</option>
          {KNOTS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-field" aria-label={v4("kamChip")} value={chipFilter} onChange={(event) => setChipFilter(event.target.value)}>
          <option value="all">{v4("kamAll")}</option>
          {CHIPS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-field" aria-label={v4("kamMast")} value={desk} onChange={(event) => setDesk(event.target.value)}>
          {KAMAL_MASTS.map((item) => <option key={item} value={item}>{mastLabel(v4, item)}</option>)}
        </select>
      </div>
      <form className="c4-kamal-views" onSubmit={(event) => {
        event.preventDefault();
        if (viewer || !viewName.trim()) return;
        storeViews(addKamalView(views, { id: `view-${Date.now().toString(36)}`, name: viewName, tray, query, helmsman: helmsmanFilter, finish: finishFilter, shade: shadeFilter, mast: mastFilter, knot: knotFilter, chip: chipFilter }));
        setViewName("");
      }}>
        <input className="c4-field" aria-label={v4("kamViewName")} aria-required={false} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} placeholder={v4("kamViewName")} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("kamSaveView")}</button>
        {views.map((view) => (
          <span key={view.id} className="c4-kamal-view">
            <button type="button" className="c4-btn" onClick={() => applyView(view)}>{v4("kamApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropKamalView(views, view.id))}>{v4("kamDropView")}</button>
          </span>
        ))}
      </form>
      {picked.length > 0 && (
        <div className="c4-kamal-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkKamalLog(cards, picked))}>{v4("kamBulkLog")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkKamalStow(cards, picked))}>{v4("kamBulkStow")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkKamalGilt(cards, picked))}>{v4("kamBulkGilt")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkKamalChampagne(cards, picked))}>{v4("kamBulkSilk")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkKamalTag(cards, picked, "b"))}>{v4("kamBulkTag")}</button>
        </div>
      )}
      <p className="c4-kamal-meta">{v4("kamSuggest")} {finishLabel(v4, suggested)} · {v4("kamFair")} {fair} · {v4("kamBusy")} {busy || v4("kamBlankKeeper")} · {v4("kamNeighbors")} {neighborKamalCount(cards)} · {v4("kamClash")} {clashMastCount(cards)} · {v4("kamKnotHint")} {knotHint} · {v4("kamMastHint")} {mastLabel(v4, mastHint)}</p>
      {(reminders.length > 0 || idling.length > 0) && (
        <p className="c4-kamal-meta">{v4("kamDue")} {reminders.map((card) => card.title).join(" · ")} · {v4("kamIdle")} {idling.map((card) => card.title).join(" · ")}</p>
      )}
      {!shown.length && <p className="c4-kamal-empty">{v4("kamEmpty")}</p>}
      <ol className={sheet === "index" ? "c4-kamal-index-list" : "c4-kamal-board"} data-density={density}>
        {shown.map((card, index) => (
          <li key={card.id} className="c4-kamal-card" data-on={index === focusAt ? "1" : "0"} data-logged={card.logged ? "1" : "0"} data-overdue={overdueKamal(card) ? "1" : "0"} data-keen={keenMast(card.mast) ? "1" : "0"} data-still={stillMast(card.mast) ? "1" : "0"} data-house={houseFinish(card.finish) ? "1" : "0"} data-brisk={briskKamal(card) ? "1" : "0"} data-idle={idleKamal(card) ? "1" : "0"} data-resting={restingKamal(card) ? "1" : "0"} data-late={lateKamal(card, desk) ? "1" : "0"}>
            <ol className="c4-kamal-ticks" aria-hidden="true">
              {CHIPS.map((tick) => <li key={tick} data-on={String(card.chip) === tick ? "1" : "0"} />)}
            </ol>
            <label className="c4-kamal-pick"><input type="checkbox" checked={picked.includes(card.id)} aria-label={card.title} onChange={() => togglePick(card.id)} /></label>
            <div>
              <input className="c4-field" aria-label={v4("kamEdit")} value={card.title} disabled={viewer} onChange={(event) => store(editKamal(cards, card.id, event.target.value))} />
              <input className="c4-field" aria-label={v4("kamEditNote")} aria-required={false} value={card.note} disabled={viewer} onChange={(event) => store(editKamalNote(cards, card.id, event.target.value))} />
              <p className="c4-kamal-meta">{card.helmsman || v4("kamBlankKeeper")} · {mastLabel(v4, card.mast)} · {finishLabel(v4, card.finish)} · {shadeLabel(v4, card.shade)} · {card.knot ?? v4("kamBlankKnot")} · {v4("kamChip")} {card.chip} · {card.tags.join(" ") || v4("kamTags")}</p>
              <p className="c4-kamal-meta">{mastLabel(v4, desk)} · {AUDIT_KEY[card.audit] ? v4(AUDIT_KEY[card.audit]) : v4("kamAuditSave")}</p>
              <div className="c4-kamal-tools">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setKamalLogged(cards, card.id, !card.logged))}>{card.logged ? v4("kamUnlog") : v4("kamLog")}</button>
                <button type="button" className="c4-btn" disabled={viewer || card.stowed} onClick={() => store(setKamalLock(cards, card.id, !card.locked))}>{card.locked ? v4("kamResume") : v4("kamLock")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setKamalStow(cards, card.id, !card.stowed))}>{card.stowed ? v4("kamOpenAgain") : v4("kamStowed")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setKamalStar(cards, card.id, !card.flagged))}>{card.flagged ? v4("kamUnstar") : v4("kamStar")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleShade(cards, card.id))}>{v4("kamShade")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(liftKnot(cards, card.id))}>{v4("kamLift")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(dipKnot(cards, card.id))}>{v4("kamDip")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseChip(cards, card.id))}>{v4("kamRaise")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerChip(cards, card.id))}>{v4("kamLower")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setKamalFinish(cards, card.id, card.finish === "CHAMPAGNE" ? "graphite" : "champagne"))}>{v4("kamFinish")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addKamalTag(cards, card.id, "a"))}>{v4("kamTags")}</button>
                <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(kamalCopy(card)); setCopied(card.id); }}>{copied === card.id ? v4("kamCopied") : v4("kamCopy")}</button>
              </div>
            </div>
          </li>
        ))}
      </ol>
      <button type="button" className="c4-btn" onClick={() => { setSort(sort === "band" ? "keeper" : "band"); }}>{sort === "band" ? v4("kamSortHelmsman") : v4("kamSortMast")}</button>
      <button type="button" className="c4-btn" onClick={() => download("kamal-sights.csv", kamalCsv(shown, desk))}>{v4("kamCsv")}</button>
    </section>
  );
}

export function DeskWatch({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: NameRow[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [shape, setShape] = useState<DeskShape>("all");
  const [review, setReview] = useState<DeskReview>("all");
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [copied, setCopied] = useState("");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = useMemo<DeskRow[]>(() => (queue.data?.users || []).map((row, index) => ({
    id: row.id ? `name-${row.id}` : `name-${index}`,
    label: textField(row.name),
    note: { desk: textField(row.desk) } satisfies DeskValue,
  })), [queue.data?.users]);
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
    const present = presentDeskLanes(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenDesks(readJson(DWB_KEY, []), present);
    const nextReviewed = readReviewedDesks(readJson(DWB_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(DWB_KEY, nextHidden);
    writeJson(DWB_REVIEW_KEY, nextReviewed);
  }, [rows]);
  const present = presentDeskLanes(rows);
  const lanes = visibleDeskLanes(present, hidden, showHidden);
  const shown = visibleDesks(rows, lane, hue, query, review, reviewed, shape).filter((row) => {
    const token = deskLane(row.note);
    if (!token) return true;
    return showHidden || !hidden.includes(token);
  });
  const focusAt = shown.length ? focus % shown.length : 0;
  const bars = deskLanes(rows);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const lead = leadingDesk(rows);
  const leadHue = leadingDeskHue(rows);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveKamalFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveKamalFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "m" || event.key === "M") {
        event.preventDefault();
        setShowHidden((value) => !value);
        return;
      }
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shown.length, focusAt]);
  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(DWB_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(DWB_REVIEW_KEY, next);
  }
  return (
    <section className="c4-deskwatch" aria-label={v4("dwbTitle")} data-plates="1" data-names={rows.length} data-role={role}>
      <header className="c4-deskwatch-mast">
        <p className="c4-deskwatch-seal" data-logo="mono">{v4("dwbLogo")}</p>
        <div>
          <p className="c4-deskwatch-kicker">{v4("dwbSub")}</p>
          <h2 className="c4-title">{v4("dwbTitle")}</h2>
        </div>
      </header>
      <ol className="c4-deskwatch-index" aria-label={v4("dwbTitle")}>
        <li data-tone="gold">{v4("dwbHouse")}</li>
        <li data-tone="ink">{v4("dwbWatch")}</li>
        <li data-tone="ivory">{v4("dwbGallery")}</li>
        <li data-tone="mist">{v4("dwbBerth")}</li>
        <li data-tone="line">{v4("dwbPlain")}</li>
      </ol>
      <p className="c4-deskwatch-links">
        <Link href={crmv4Href(base, "kam")}>{v4("kamTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("kamCustomers")}</Link>
        <Link href={crmv4Href(base, "week")}>{v4("kamWeek")}</Link>
      </p>
      <p className="c4-deskwatch-hint">{v4("dwbHint")}</p>
      {viewer && <p className="c4-deskwatch-note">{v4("dwbViewer")}</p>}
      {queue.loading && <p className="c4-deskwatch-meta">{v4("dwbEmpty")}</p>}
      {queue.error && <p className="c4-deskwatch-meta">{queue.error}</p>}
      <ul className="c4-deskwatch-kpis" aria-label={v4("dwbRules")}>
        <li><span>{v4("dwbLead")}</span><strong>{lead ? laneLabel(v4, lead) : v4("dwbUnmarked")}</strong></li>
        <li><span>{v4("dwbToneLead")}</span><strong>{leadHue ? hueLabel(v4, leadHue) : v4("dwbUnmarked")}</strong></li>
        <li><span>{v4("dwbShared")}</span><strong>{sharedDeskCount(rows)}</strong></li>
        <li><span>{v4("dwbShare")}</span><strong>{deskShare(laneDeskCount(rows, "watch"), Math.max(1, rows.length))}%</strong></li>
        <li><span>{v4("dwbKnown")}</span><strong>{rows.filter((row) => deskKnown(row.note)).length}</strong></li>
        <li><span>{v4("dwbTwin")}</span><strong>{rows.filter((row) => deskTwin(row.note)).length}</strong></li>
        <li><span>{v4("dwbVowel")}</span><strong>{rows.filter((row) => deskVowel(row.note)).length}</strong></li>
        <li><span>{v4("dwbWords")}</span><strong>{rows.reduce((sum, row) => sum + deskWords(row.note), 0)}</strong></li>
      </ul>
      <div className="c4-deskwatch-chart" aria-label={v4("dwbRules")}>
        {bars.map((bar) => (
          <button key={bar.lane} type="button" className="c4-deskwatch-column" data-on={lane === bar.lane ? "1" : "0"} data-lane={bar.lane} onClick={() => setLane(lane === bar.lane ? "all" : bar.lane)}>
            <i style={{ height: `${Math.max(12, Math.round((bar.count / maxBar) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{laneLabel(v4, bar.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-deskwatch-tools">
        <input ref={searchRef} className="c4-field c4-deskwatch-search" aria-label={v4("dwbSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("dwbSearch")} />
        {(["all", "ivory", "graphite", "champagne"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("dwbAll") : hueLabel(v4, item)}</button>
        ))}
        {(["all", "gallery", "watch", "house", "berth", "span", "plain", "wide", "notch", "leap", "slash", "twin", "known", "echo", "vowel"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>
            {item === "all" ? v4("dwbShapeAll") : item === "wide" ? v4("dwbShapeWide") : item === "notch" ? v4("dwbShapeNotch") : item === "leap" ? v4("dwbShapeLeap") : item === "slash" ? v4("dwbShapeSlash") : item === "twin" ? v4("dwbShapeTwin") : item === "known" ? v4("dwbShapeKnown") : item === "echo" ? v4("dwbShapeEcho") : item === "vowel" ? v4("dwbShapeVowel") : laneLabel(v4, item)}
          </button>
        ))}
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{item === "all" ? v4("dwbAll") : item === "reviewed" ? v4("dwbReviewed") : v4("dwbUnreviewed")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("dwbShow")}</button>
      </div>
      <ul className="c4-deskwatch-lanes">
        {lanes.map((item) => (
          <li key={item}>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(toggleDesk(hidden, item))}>{hidden.includes(item) ? v4("dwbShow") : v4("dwbHide")} {laneLabel(v4, item)}</button>
          </li>
        ))}
      </ul>
      {picked.length > 0 && (
        <div className="c4-deskwatch-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkDeskReview(reviewed, picked, true))}>{v4("dwbBulkReview")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkDeskReview(reviewed, picked, false))}>{v4("dwbBulkClear")}</button>
        </div>
      )}
      {!shown.length && <p className="c4-deskwatch-empty">{v4("dwbEmpty")}</p>}
      <ol className="c4-deskwatch-board">
        {shown.map((row, index) => {
          const seen = reviewed.includes(row.id);
          return (
            <li key={row.id} className="c4-deskwatch-card" data-on={index === focusAt ? "1" : "0"} data-lane={deskLane(row.note)} data-hue={deskHue(row.note)} data-reviewed={seen ? "1" : "0"} data-known={deskKnown(row.note) ? "1" : "0"}>
              <p className="c4-deskwatch-stamp">{deskStamp(row.note) || "·"}</p>
              <label className="c4-deskwatch-pick"><input type="checkbox" checked={picked.includes(row.id)} aria-label={row.label || row.id} onChange={() => setPicked((current) => (current.includes(row.id) ? current.filter((item) => item !== row.id) : [...current, row.id]))} /></label>
              <div>
                <strong>{row.label || v4("dwbUnmarked")}</strong>
                <p className="c4-deskwatch-meta">{laneLabel(v4, deskLane(row.note))} · {hueLabel(v4, deskHue(row.note))} · {v4("dwbStep")} {deskStep(row.note)} · {v4("dwbWords")} {deskWords(row.note)}{deskCap(row.note) ? ` · ${v4("dwbCap")}` : ""}{deskTail(row.note) ? ` · ${v4("dwbTail")}` : ""}{deskWide(row.note) ? ` · ${v4("dwbWide")}` : ""}{deskNotch(row.note) ? ` · ${v4("dwbNotch")}` : ""}{deskLeap(row.note) ? ` · ${v4("dwbLeap")}` : ""}{deskSlash(row.note) ? ` · ${v4("dwbSlash")}` : ""}{deskEcho(row.note) ? ` · ${v4("dwbEcho")}` : ""}</p>
                <div className="c4-deskwatch-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleDeskReview(reviewed, row.id))}>{seen ? v4("dwbReviewed") : v4("dwbReview")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(deskCopy(row.note)); setCopied(row.id); }}>{copied === row.id ? v4("dwbCopied") : v4("dwbCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="c4-deskwatch-tools">
        <button type="button" className="c4-btn" onClick={() => download("desk-lanes.csv", deskLanesCsv(rows))}>{v4("dwbCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("desk-rows.csv", deskRowsCsv(shown, reviewed))}>{v4("dwbRowCsv")}</button>
      </div>
    </section>
  );
}
