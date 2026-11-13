"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  BACKSTAFF_LIMBS,
  BST_DENSITY_KEY,
  BST_KEY,
  BST_VIEW_KEY,
  LIR_KEY,
  LIR_REVIEW_KEY,
  addBackstaff,
  addBackstaffTag,
  addBackstaffView,
  backstaffBars,
  backstaffCopy,
  backstaffCounts,
  backstaffCsv,
  backstaffDensity,
  backstaffKeepers,
  backstaffTimeline,
  briskBackstaff,
  bulkBackstaffChampagne,
  bulkBackstaffGilt,
  bulkBackstaffLog,
  bulkBackstaffStow,
  bulkBackstaffTag,
  bulkReasonReview,
  busiestKeeper,
  clashMastCount,
  cycleShade,
  dipKnot,
  dipKnotFocused,
  dropBackstaffView,
  editBackstaff,
  editBackstaffNote,
  fairKeeper,
  houseFinish,
  idleBackstaff,
  idleBackstaffs,
  keenMast,
  laneReasonCount,
  lateBackstaff,
  leadingReason,
  leadingReasonHue,
  liftKnot,
  liftKnotFocused,
  lockBackstaffFocused,
  logBackstaffFocused,
  lowerChip,
  lowerChipFocused,
  moveBackstaffFocus,
  neighborBackstaffCount,
  overdueBackstaff,
  presentReasonLanes,
  raiseChip,
  raiseChipFocused,
  readBackstaffViews,
  readBackstaffs,
  readHiddenReasons,
  readReviewedReasons,
  reminderBackstaffs,
  restingBackstaff,
  setBackstaffFinish,
  setBackstaffLock,
  setBackstaffLogged,
  setBackstaffStar,
  setBackstaffStow,
  sharedReasonCount,
  sortBackstaffs,
  reasonCap,
  reasonCopy,
  reasonEcho,
  reasonHue,
  reasonKnown,
  reasonLane,
  reasonLanes,
  reasonLanesCsv,
  reasonLeap,
  reasonNotch,
  reasonRowsCsv,
  reasonShare,
  reasonSlash,
  reasonStamp,
  reasonStep,
  reasonTail,
  reasonTwin,
  reasonVowel,
  reasonWide,
  reasonWords,
  starBackstaffFocused,
  stillMast,
  suggestKnot,
  suggestFinish,
  suggestMast,
  tagBackstaffFocused,
  toggleReason,
  toggleReasonReview,
  toneFocused,
  visibleBackstaffs,
  visibleReasonLanes,
  visibleReasons,
  type BackstaffDensity,
  type BackstaffSort,
  type BackstaffTray,
  type BackstaffView,
  type BackstaffSight,
  type ReasonReview,
  type ReasonRow,
  type ReasonShape,
  type ReasonValue,
} from "@/lib/crmv4/round280";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const METALS = ["ivory", "graphite", "champagne"] as const;
const SHADES = ["pearl", "ink", "brass"] as const;
const KNOTS = ["30", "60", "90"] as const;
const CHIPS = ["1", "4", "7"] as const;

const MAST_KEY: Record<string, CrmV4CopyKey> = {
  limb: "bstLimb",
  arc: "bstArc",
  vane: "bstVane",
  sight: "bstSight",
  keen: "bstKeen",
  still: "bstStill",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "bstAuditSave",
  edit: "bstAuditEdit",
  note: "bstAuditNote",
  shade: "bstAuditShade",
  log: "bstAuditLog",
  unlog: "bstAuditUnlog",
  lock: "bstAuditLock",
  resume: "bstAuditResume",
  stow: "bstAuditStow",
  open: "bstAuditOpen",
  finish: "bstAuditFinish",
  tag: "bstAuditTag",
  chip: "bstAuditChip",
  knot: "bstAuditKnot",
  dip: "bstAuditDip",
  star: "bstAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  duplicate: "lirDuplicate",
  geo: "lirGeo",
  number: "lirNumber",
  age: "lirAge",
  hours: "lirHours",
  papers: "lirPapers",
  other: "lirOther",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  ivory: "lirIvory",
  graphite: "lirGraphite",
  champagne: "lirChampagne",
};

type NameRow = {
  id?: string;
  name?: string | null;
  leadInvalidReason?: string | null;
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
  return key ? v4(key) : v4("bstBlank");
}

function finishLabel(v4: V4, finish: string): string {
  if (finish === "IVORY") return v4("bstIvory");
  if (finish === "GRAPHITE") return v4("bstGraphite");
  if (finish === "CHAMPAGNE") return v4("bstChampagne");
  return v4("bstBlankFinish");
}

function shadeLabel(v4: V4, shade: string): string {
  if (shade === "pearl") return v4("bstPearl");
  if (shade === "ink") return v4("bstInk");
  if (shade === "brass") return v4("bstBrass");
  return v4("bstBlankShade");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("lirUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("lirUnmarked");
}

export function BackstaffSights({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<BackstaffSight[]>([]);
  const [views, setViews] = useState<BackstaffView[]>([]);
  const [density, setDensity] = useState<BackstaffDensity>("open");
  const [sheet, setSheet] = useState<"board" | "index">("board");
  const [tray, setTray] = useState<BackstaffTray>("deck");
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
  const [sort, setSort] = useState<BackstaffSort>("band");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [helmsman, setHelmsman] = useState("");
  const [mast, setMast] = useState("");
  const [finish, setFinish] = useState("");
  const [shade, setShade] = useState("");
  const [knotNo, setKnotNo] = useState("");
  const [chipNo, setChipNo] = useState("1");
  const [tags, setTags] = useState("");
  const [viewName, setViewName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focusAt, setFocusAt] = useState(0);
  const [copied, setCopied] = useState("");
  const [desk, setDesk] = useState("limb");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readBackstaffs(readJson(BST_KEY, [])));
    setViews(readBackstaffViews(readJson(BST_VIEW_KEY, [])));
    setDensity(backstaffDensity(readJson(BST_DENSITY_KEY, "open")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: BackstaffSight[]) {
    setCards(next);
    writeJson(BST_KEY, next);
  }
  function storeViews(next: BackstaffView[]) {
    setViews(next);
    writeJson(BST_VIEW_KEY, next);
  }
  function storeDensity(next: BackstaffDensity) {
    setDensity(next);
    writeJson(BST_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortBackstaffs(visibleBackstaffs(cards, tray, query, helmsmanFilter, finishFilter, shadeFilter, mastFilter, knotFilter, chipFilter, houseOnly, keenOnly, stillOnly), sort),
    [cards, tray, query, helmsmanFilter, finishFilter, shadeFilter, mastFilter, knotFilter, chipFilter, houseOnly, keenOnly, stillOnly, sort],
  );
  const counts = backstaffCounts(cards, shown, desk);
  const bars = backstaffBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = backstaffTimeline(cards);
  const helmsmen = backstaffKeepers(cards);
  const ids = shown.map((card) => card.id);
  const suggested = suggestFinish(cards);
  const fair = fairKeeper(cards, helmsmen.join(","));
  const busy = busiestKeeper(cards);
  const reminders = reminderBackstaffs(cards);
  const idling = idleBackstaffs(cards);
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
        setFocusAt((index) => moveBackstaffFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocusAt((index) => moveBackstaffFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        if (!viewer) store(logBackstaffFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "h" || event.key === "H") {
        event.preventDefault();
        if (!viewer) store(lockBackstaffFocused(cards, ids, focusAt));
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
        if (!viewer) store(tagBackstaffFocused(cards, ids, focusAt, "a"));
        return;
      }
      if (event.key === "w" || event.key === "W") {
        event.preventDefault();
        if (!viewer) store(starBackstaffFocused(cards, ids, focusAt));
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

  function applyView(view: BackstaffView) {
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
    <section className="c4-backstaff" aria-label={v4("bstTitle")} data-cards="1" data-desk="horizon" data-role={role} data-density={density} data-sheet={sheet}>
      <header className="c4-backstaff-mast">
        <p className="c4-backstaff-seal" data-logo="mono">{v4("bstLogo")}</p>
        <div>
          <p className="c4-backstaff-kicker">{v4("bstSub")}</p>
          <h2 className="c4-title">{v4("bstTitle")}</h2>
        </div>
        <ol className="c4-backstaff-index" aria-label={v4("bstTitle")}>
          <li data-tone="gold">{v4("bstBrass")}</li>
          <li data-tone="ink">{v4("bstInk")}</li>
          <li data-tone="ivory">{v4("bstPearl")}</li>
        </ol>
      </header>
      <p className="c4-backstaff-links">
        <Link href={crmv4Href(base, "lir")}>{v4("lirTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("bstCustomers")}</Link>
        <Link href={crmv4Href(base, "marketing")}>{v4("bstWeek")}</Link>
      </p>
      {viewer && <p className="c4-backstaff-note">{v4("bstViewer")}</p>}
      <p className="c4-backstaff-lead">{v4("bstKeys")}</p>
      <p className="c4-backstaff-hint">{v4("bstHint")}</p>
      <p className="c4-backstaff-notice" role="status">{v4("bstNotice")} {counts.overdue}</p>
      <ol className="c4-backstaff-dials" aria-label={v4("bstChart")}>
        <li><span>{v4("bstDeck")}</span><strong>{counts.deck}</strong></li>
        <li><span>{v4("bstLocker")}</span><strong>{counts.locker}</strong></li>
        <li><span>{v4("bstBilge")}</span><strong>{counts.bilge}</strong></li>
        <li><span>{v4("bstLogged")}</span><strong>{counts.logged}</strong></li>
        <li><span>{v4("bstOverdue")}</span><strong>{counts.overdue}</strong></li>
        <li><span>{v4("bstEven")}</span><strong>{counts.even}</strong></li>
      </ol>
      <div className="c4-backstaff-chart" aria-label={v4("bstBars")}>
        {bars.map((bar) => (
          <button key={bar.mast} type="button" className="c4-backstaff-column" data-on={mastFilter === bar.mast ? "1" : "0"} onClick={() => setMastFilter(mastFilter === bar.mast ? "all" : bar.mast)}>
            <i style={{ height: `${Math.max(8, Math.round((bar.count / peak) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{mastLabel(v4, bar.mast)}</span>
          </button>
        ))}
      </div>
      <ol className="c4-backstaff-time" aria-label={v4("bstIndex")}>
        {timeline.map((lane) => (
          <li key={lane.chip}><span>{lane.chip}</span><strong>{lane.titles.join(" · ")}</strong></li>
        ))}
      </ol>
      <form className="c4-backstaff-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const id = `bst-${Date.now().toString(36)}`;
        store(addBackstaff(cards, { id, title, note, helmsman, mast, finish, shade, knot: knotNo, chip: chipNo, tags }));
        setTitle("");
        setNote("");
        setTags("");
      }}>
        <input className="c4-field" aria-label={v4("bstEdit")} aria-required={false} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} placeholder={v4("bstTitle")} />
        <input className="c4-field" aria-label={v4("bstNote")} aria-required={false} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} placeholder={v4("bstNote")} />
        <input className="c4-field" aria-label={v4("bstFair")} aria-required={false} value={helmsman} disabled={viewer} onChange={(event) => setHelmsman(event.target.value)} placeholder={v4("bstBlankKeeper")} />
        <select className="c4-field" aria-label={v4("bstMast")} value={mast} disabled={viewer} onChange={(event) => setMast(event.target.value)}>
          <option value="">{v4("bstBlankMast")}</option>
          {BACKSTAFF_LIMBS.map((item) => <option key={item} value={item}>{mastLabel(v4, item)}</option>)}
        </select>
        <select className="c4-field" aria-label={v4("bstFinish")} value={finish} disabled={viewer} onChange={(event) => setFinish(event.target.value)}>
          <option value="">{v4("bstBlankFinish")}</option>
          {METALS.map((item) => <option key={item} value={item}>{finishLabel(v4, item.toUpperCase())}</option>)}
        </select>
        <select className="c4-field" aria-label={v4("bstShade")} value={shade} disabled={viewer} onChange={(event) => setShade(event.target.value)}>
          <option value="">{v4("bstBlankShade")}</option>
          {SHADES.map((item) => <option key={item} value={item}>{shadeLabel(v4, item)}</option>)}
        </select>
        <select className="c4-field" aria-label={v4("bstKnot")} value={knotNo} disabled={viewer} onChange={(event) => setKnotNo(event.target.value)}>
          <option value="">{v4("bstBlankKnot")}</option>
          {KNOTS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-field" aria-label={v4("bstChip")} value={chipNo} disabled={viewer} onChange={(event) => setChipNo(event.target.value)}>
          {CHIPS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <input className="c4-field" aria-label={v4("bstTags")} aria-required={false} value={tags} disabled={viewer} onChange={(event) => setTags(event.target.value)} placeholder={v4("bstTags")} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("bstAdd")}</button>
      </form>
      <div className="c4-backstaff-tools">
        <input ref={searchRef} className="c4-field c4-backstaff-search" aria-label={v4("bstSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("bstSearch")} />
        {(["deck", "locker", "bilge"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{item === "deck" ? v4("bstDeck") : item === "locker" ? v4("bstLocker") : v4("bstBilge")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={density === "close" ? "1" : "0"} onClick={() => storeDensity(density === "close" ? "open" : "close")}>{v4("bstTight")}</button>
        <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((value) => !value)}>{v4("bstHouse")}</button>
        <button type="button" className="c4-chip" data-on={keenOnly ? "1" : "0"} onClick={() => setKeenOnly((value) => !value)}>{v4("bstKeen")}</button>
        <button type="button" className="c4-chip" data-on={stillOnly ? "1" : "0"} onClick={() => setStillOnly((value) => !value)}>{v4("bstStill")}</button>
        <select className="c4-field" aria-label={v4("bstFair")} value={helmsmanFilter} onChange={(event) => setHelmsmanFilter(event.target.value)}>
          <option value="all">{v4("bstAll")}</option>
          {helmsmen.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-field" aria-label={v4("bstFinish")} value={finishFilter} onChange={(event) => setFinishFilter(event.target.value)}>
          <option value="all">{v4("bstAll")}</option>
          {METALS.map((item) => <option key={item} value={item}>{finishLabel(v4, item.toUpperCase())}</option>)}
        </select>
        <select className="c4-field" aria-label={v4("bstShade")} value={shadeFilter} onChange={(event) => setShadeFilter(event.target.value)}>
          <option value="all">{v4("bstAll")}</option>
          {SHADES.map((item) => <option key={item} value={item}>{shadeLabel(v4, item)}</option>)}
        </select>
        <select className="c4-field" aria-label={v4("bstMast")} value={mastFilter} onChange={(event) => setMastFilter(event.target.value)}>
          <option value="all">{v4("bstAll")}</option>
          <option value="keen">{v4("bstKeen")}</option>
          <option value="still">{v4("bstStill")}</option>
          {BACKSTAFF_LIMBS.map((item) => <option key={item} value={item}>{mastLabel(v4, item)}</option>)}
        </select>
        <select className="c4-field" aria-label={v4("bstKnot")} value={knotFilter} onChange={(event) => setKnotFilter(event.target.value)}>
          <option value="all">{v4("bstAll")}</option>
          {KNOTS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-field" aria-label={v4("bstChip")} value={chipFilter} onChange={(event) => setChipFilter(event.target.value)}>
          <option value="all">{v4("bstAll")}</option>
          {CHIPS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-field" aria-label={v4("bstMast")} value={desk} onChange={(event) => setDesk(event.target.value)}>
          {BACKSTAFF_LIMBS.map((item) => <option key={item} value={item}>{mastLabel(v4, item)}</option>)}
        </select>
      </div>
      <form className="c4-backstaff-views" onSubmit={(event) => {
        event.preventDefault();
        if (viewer || !viewName.trim()) return;
        storeViews(addBackstaffView(views, { id: `view-${Date.now().toString(36)}`, name: viewName, tray, query, helmsman: helmsmanFilter, finish: finishFilter, shade: shadeFilter, mast: mastFilter, knot: knotFilter, chip: chipFilter }));
        setViewName("");
      }}>
        <input className="c4-field" aria-label={v4("bstViewName")} aria-required={false} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} placeholder={v4("bstViewName")} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("bstSaveView")}</button>
        {views.map((view) => (
          <span key={view.id} className="c4-backstaff-view">
            <button type="button" className="c4-btn" onClick={() => applyView(view)}>{v4("bstApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropBackstaffView(views, view.id))}>{v4("bstDropView")}</button>
          </span>
        ))}
      </form>
      {picked.length > 0 && (
        <div className="c4-backstaff-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkBackstaffLog(cards, picked))}>{v4("bstBulkLog")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkBackstaffStow(cards, picked))}>{v4("bstBulkStow")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkBackstaffGilt(cards, picked))}>{v4("bstBulkGilt")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkBackstaffChampagne(cards, picked))}>{v4("bstBulkSilk")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkBackstaffTag(cards, picked, "b"))}>{v4("bstBulkTag")}</button>
        </div>
      )}
      <p className="c4-backstaff-meta">{v4("bstSuggest")} {finishLabel(v4, suggested)} · {v4("bstFair")} {fair} · {v4("bstBusy")} {busy || v4("bstBlankKeeper")} · {v4("bstNeighbors")} {neighborBackstaffCount(cards)} · {v4("bstClash")} {clashMastCount(cards)} · {v4("bstKnotHint")} {knotHint} · {v4("bstMastHint")} {mastLabel(v4, mastHint)}</p>
      {(reminders.length > 0 || idling.length > 0) && (
        <p className="c4-backstaff-meta">{v4("bstDue")} {reminders.map((card) => card.title).join(" · ")} · {v4("bstIdle")} {idling.map((card) => card.title).join(" · ")}</p>
      )}
      {!shown.length && <p className="c4-backstaff-empty">{v4("bstEmpty")}</p>}
      <ol className={sheet === "index" ? "c4-backstaff-index-list" : "c4-backstaff-board"} data-density={density}>
        {shown.map((card, index) => (
          <li key={card.id} className="c4-backstaff-card" data-on={index === focusAt ? "1" : "0"} data-logged={card.logged ? "1" : "0"} data-overdue={overdueBackstaff(card) ? "1" : "0"} data-keen={keenMast(card.mast) ? "1" : "0"} data-still={stillMast(card.mast) ? "1" : "0"} data-house={houseFinish(card.finish) ? "1" : "0"} data-brisk={briskBackstaff(card) ? "1" : "0"} data-idle={idleBackstaff(card) ? "1" : "0"} data-resting={restingBackstaff(card) ? "1" : "0"} data-late={lateBackstaff(card, desk) ? "1" : "0"}>
            <ol className="c4-backstaff-ticks" aria-hidden="true">
              {CHIPS.map((tick) => <li key={tick} data-on={String(card.chip) === tick ? "1" : "0"} />)}
            </ol>
            <label className="c4-backstaff-pick"><input type="checkbox" checked={picked.includes(card.id)} aria-label={card.title} onChange={() => togglePick(card.id)} /></label>
            <div>
              <input className="c4-field" aria-label={v4("bstEdit")} value={card.title} disabled={viewer} onChange={(event) => store(editBackstaff(cards, card.id, event.target.value))} />
              <input className="c4-field" aria-label={v4("bstEditNote")} aria-required={false} value={card.note} disabled={viewer} onChange={(event) => store(editBackstaffNote(cards, card.id, event.target.value))} />
              <p className="c4-backstaff-meta">{card.helmsman || v4("bstBlankKeeper")} · {mastLabel(v4, card.mast)} · {finishLabel(v4, card.finish)} · {shadeLabel(v4, card.shade)} · {card.knot ?? v4("bstBlankKnot")} · {v4("bstChip")} {card.chip} · {card.tags.join(" ") || v4("bstTags")}</p>
              <p className="c4-backstaff-meta">{mastLabel(v4, desk)} · {AUDIT_KEY[card.audit] ? v4(AUDIT_KEY[card.audit]) : v4("bstAuditSave")}</p>
              <div className="c4-backstaff-tools">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBackstaffLogged(cards, card.id, !card.logged))}>{card.logged ? v4("bstUnlog") : v4("bstLog")}</button>
                <button type="button" className="c4-btn" disabled={viewer || card.stowed} onClick={() => store(setBackstaffLock(cards, card.id, !card.locked))}>{card.locked ? v4("bstResume") : v4("bstLock")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBackstaffStow(cards, card.id, !card.stowed))}>{card.stowed ? v4("bstOpenAgain") : v4("bstStowed")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBackstaffStar(cards, card.id, !card.flagged))}>{card.flagged ? v4("bstUnstar") : v4("bstStar")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleShade(cards, card.id))}>{v4("bstShade")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(liftKnot(cards, card.id))}>{v4("bstLift")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(dipKnot(cards, card.id))}>{v4("bstDip")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseChip(cards, card.id))}>{v4("bstRaise")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerChip(cards, card.id))}>{v4("bstLower")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBackstaffFinish(cards, card.id, card.finish === "CHAMPAGNE" ? "graphite" : "champagne"))}>{v4("bstFinish")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addBackstaffTag(cards, card.id, "a"))}>{v4("bstTags")}</button>
                <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(backstaffCopy(card)); setCopied(card.id); }}>{copied === card.id ? v4("bstCopied") : v4("bstCopy")}</button>
              </div>
            </div>
          </li>
        ))}
      </ol>
      <button type="button" className="c4-btn" onClick={() => { setSort(sort === "band" ? "keeper" : "band"); }}>{sort === "band" ? v4("bstSortHelmsman") : v4("bstSortMast")}</button>
      <button type="button" className="c4-btn" onClick={() => download("backstaff-sights.csv", backstaffCsv(shown, desk))}>{v4("bstCsv")}</button>
    </section>
  );
}

export function ReasonPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: NameRow[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [shape, setShape] = useState<ReasonShape>("all");
  const [review, setReview] = useState<ReasonReview>("all");
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [copied, setCopied] = useState("");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = useMemo<ReasonRow[]>(() => (queue.data?.users || []).map((row, index) => ({
    id: row.id ? `name-${row.id}` : `name-${index}`,
    label: textField(row.name),
    note: { leadInvalidReason: textField(row.leadInvalidReason) } satisfies ReasonValue,
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
    const present = presentReasonLanes(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenReasons(readJson(LIR_KEY, []), present);
    const nextReviewed = readReviewedReasons(readJson(LIR_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(LIR_KEY, nextHidden);
    writeJson(LIR_REVIEW_KEY, nextReviewed);
  }, [rows]);
  const present = presentReasonLanes(rows);
  const lanes = visibleReasonLanes(present, hidden, showHidden);
  const shown = visibleReasons(rows, lane, hue, query, review, reviewed, shape).filter((row) => {
    const token = reasonLane(row.note);
    if (!token) return true;
    return showHidden || !hidden.includes(token);
  });
  const focusAt = shown.length ? focus % shown.length : 0;
  const bars = reasonLanes(rows);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const lead = leadingReason(rows);
  const leadHue = leadingReasonHue(rows);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveBackstaffFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveBackstaffFocus(index, shown.length, -1));
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
    writeJson(LIR_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(LIR_REVIEW_KEY, next);
  }
  return (
    <section className="c4-reasonplate" aria-label={v4("lirTitle")} data-plates="1" data-names={rows.length} data-role={role}>
      <header className="c4-reasonplate-mast">
        <p className="c4-reasonplate-seal" data-logo="mono">{v4("lirLogo")}</p>
        <div>
          <p className="c4-reasonplate-kicker">{v4("lirSub")}</p>
          <h2 className="c4-title">{v4("lirTitle")}</h2>
        </div>
      </header>
      <ol className="c4-reasonplate-index" aria-label={v4("lirTitle")}>
        <li data-tone="gold">{v4("lirDuplicate")}</li>
        <li data-tone="ink">{v4("lirGeo")}</li>
        <li data-tone="ivory">{v4("lirNumber")}</li>
        <li data-tone="mist">{v4("lirAge")}</li>
        <li data-tone="line">{v4("lirPapers")}</li>
      </ol>
      <p className="c4-reasonplate-links">
        <Link href={crmv4Href(base, "bst")}>{v4("bstTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("bstCustomers")}</Link>
        <Link href={crmv4Href(base, "marketing")}>{v4("bstWeek")}</Link>
      </p>
      <p className="c4-reasonplate-hint">{v4("lirHint")}</p>
      {viewer && <p className="c4-reasonplate-note">{v4("lirViewer")}</p>}
      {queue.loading && <p className="c4-reasonplate-meta">{v4("lirEmpty")}</p>}
      {queue.error && <p className="c4-reasonplate-meta">{queue.error}</p>}
      <ul className="c4-reasonplate-kpis" aria-label={v4("lirRules")}>
        <li><span>{v4("lirLead")}</span><strong>{lead ? laneLabel(v4, lead) : v4("lirUnmarked")}</strong></li>
        <li><span>{v4("lirToneLead")}</span><strong>{leadHue ? hueLabel(v4, leadHue) : v4("lirUnmarked")}</strong></li>
        <li><span>{v4("lirShared")}</span><strong>{sharedReasonCount(rows)}</strong></li>
        <li><span>{v4("lirShare")}</span><strong>{reasonShare(laneReasonCount(rows, "duplicate"), Math.max(1, rows.length))}%</strong></li>
        <li><span>{v4("lirKnown")}</span><strong>{rows.filter((row) => reasonKnown(row.note)).length}</strong></li>
        <li><span>{v4("lirTwin")}</span><strong>{rows.filter((row) => reasonTwin(row.note)).length}</strong></li>
        <li><span>{v4("lirVowel")}</span><strong>{rows.filter((row) => reasonVowel(row.note)).length}</strong></li>
        <li><span>{v4("lirWords")}</span><strong>{rows.reduce((sum, row) => sum + reasonWords(row.note), 0)}</strong></li>
      </ul>
      <div className="c4-reasonplate-chart" aria-label={v4("lirRules")}>
        {bars.map((bar) => (
          <button key={bar.lane} type="button" className="c4-reasonplate-column" data-on={lane === bar.lane ? "1" : "0"} data-lane={bar.lane} onClick={() => setLane(lane === bar.lane ? "all" : bar.lane)}>
            <i style={{ height: `${Math.max(12, Math.round((bar.count / maxBar) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{laneLabel(v4, bar.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-reasonplate-tools">
        <input ref={searchRef} className="c4-field c4-reasonplate-search" aria-label={v4("lirSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("lirSearch")} />
        {(["all", "ivory", "graphite", "champagne"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("lirAll") : hueLabel(v4, item)}</button>
        ))}
        {(["all", "duplicate", "geo", "number", "age", "hours", "papers", "other", "wide", "notch", "leap", "slash", "twin", "known", "echo", "vowel"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>
            {item === "all" ? v4("lirShapeAll") : item === "wide" ? v4("lirShapeWide") : item === "notch" ? v4("lirShapeNotch") : item === "leap" ? v4("lirShapeLeap") : item === "slash" ? v4("lirShapeSlash") : item === "twin" ? v4("lirShapeTwin") : item === "known" ? v4("lirShapeKnown") : item === "echo" ? v4("lirShapeEcho") : item === "vowel" ? v4("lirShapeVowel") : laneLabel(v4, item)}
          </button>
        ))}
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{item === "all" ? v4("lirAll") : item === "reviewed" ? v4("lirReviewed") : v4("lirUnreviewed")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("lirShow")}</button>
      </div>
      <ul className="c4-reasonplate-lanes">
        {lanes.map((item) => (
          <li key={item}>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(toggleReason(hidden, item))}>{hidden.includes(item) ? v4("lirShow") : v4("lirHide")} {laneLabel(v4, item)}</button>
          </li>
        ))}
      </ul>
      {picked.length > 0 && (
        <div className="c4-reasonplate-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkReasonReview(reviewed, picked, true))}>{v4("lirBulkReview")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkReasonReview(reviewed, picked, false))}>{v4("lirBulkClear")}</button>
        </div>
      )}
      {!shown.length && <p className="c4-reasonplate-empty">{v4("lirEmpty")}</p>}
      <ol className="c4-reasonplate-board">
        {shown.map((row, index) => {
          const seen = reviewed.includes(row.id);
          return (
            <li key={row.id} className="c4-reasonplate-card" data-on={index === focusAt ? "1" : "0"} data-lane={reasonLane(row.note)} data-hue={reasonHue(row.note)} data-reviewed={seen ? "1" : "0"} data-known={reasonKnown(row.note) ? "1" : "0"}>
              <p className="c4-reasonplate-stamp">{reasonStamp(row.note) || "·"}</p>
              <label className="c4-reasonplate-pick"><input type="checkbox" checked={picked.includes(row.id)} aria-label={row.label || row.id} onChange={() => setPicked((current) => (current.includes(row.id) ? current.filter((item) => item !== row.id) : [...current, row.id]))} /></label>
              <div>
                <strong>{row.label || v4("lirUnmarked")}</strong>
                <p className="c4-reasonplate-meta">{laneLabel(v4, reasonLane(row.note))} · {hueLabel(v4, reasonHue(row.note))} · {v4("lirStep")} {reasonStep(row.note)} · {v4("lirWords")} {reasonWords(row.note)}{reasonCap(row.note) ? ` · ${v4("lirCap")}` : ""}{reasonTail(row.note) ? ` · ${v4("lirTail")}` : ""}{reasonWide(row.note) ? ` · ${v4("lirWide")}` : ""}{reasonNotch(row.note) ? ` · ${v4("lirNotch")}` : ""}{reasonLeap(row.note) ? ` · ${v4("lirLeap")}` : ""}{reasonSlash(row.note) ? ` · ${v4("lirSlash")}` : ""}{reasonEcho(row.note) ? ` · ${v4("lirEcho")}` : ""}</p>
                <div className="c4-reasonplate-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleReasonReview(reviewed, row.id))}>{seen ? v4("lirReviewed") : v4("lirReview")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(reasonCopy(row.note)); setCopied(row.id); }}>{copied === row.id ? v4("lirCopied") : v4("lirCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="c4-reasonplate-tools">
        <button type="button" className="c4-btn" onClick={() => download("reason-lanes.csv", reasonLanesCsv(rows))}>{v4("lirCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("reason-rows.csv", reasonRowsCsv(shown, reviewed))}>{v4("lirRowCsv")}</button>
      </div>
    </section>
  );
}
