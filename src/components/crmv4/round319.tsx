"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  FLT_DENSITY_KEY,
  FLT_KEY,
  FLT_LIMBS,
  FLT_VIEW_KEY,
  RTR_KEY,
  RTR_REVIEW_KEY,
  addFoliot,
  addFoliotTag,
  addFoliotView,
  briskFoliot,
  bulkFoliotCoffer,
  bulkFoliotGraphite,
  bulkFoliotWind,
  bulkFoliotTag,
  bulkRutterReview,
  busiestWarden,
  foliotBars,
  foliotCopy,
  foliotCounts,
  foliotCsv,
  foliotDensity,
  foliotInner,
  foliotWardens,
  foliotOuter,
  foliotTimeline,
  dropFoliotView,
  editFoliot,
  editFoliotNote,
  fairWarden,
  idleFoliot,
  inkFocused,
  laneRutterCount,
  lateFoliot,
  leadingRutter,
  leadingRutterHue,
  liftNotchFocused,
  lowerSwingFocused,
  lowerNotchFocused,
  moveFoliotFocus,
  overdueFoliot,
  hookFoliotFocused,
  rutterReach,
  rutterCapital,
  rutterSplice,
  rutterCipher,
  rutterCopy,
  rutterEven,
  rutterFamily,
  rutterFirst,
  rutterHeld,
  rutterHue,
  rutterHyphen,
  rutterLane,
  rutterLanes,
  rutterLanesCsv,
  rutterLength,
  rutterLetter,
  rutterLower,
  rutterMixed,
  rutterInlet,
  rutterOpen,
  rutterPeriod,
  rutterRowsCsv,
  rutterShare,
  rutterSpace,
  rutterStamp,
  rutterTail,
  rutterUpper,
  presentRutterLanes,
  raiseSwingFocused,
  readFoliotRules,
  readFoliotViews,
  readHiddenRutter,
  readReviewedRutter,
  reminderFoliotRules,
  restingFoliot,
  setFoliotCoffer,
  setFoliotFocused,
  setFoliotInk,
  setFoliotHook,
  setFoliotWind,
  setFoliotStar,
  sortFoliotRules,
  starFoliotFocused,
  suggestNotch,
  suggestInk,
  suggestLimb,
  toggleRutter,
  toggleRutterReview,
  visibleFoliotRules,
  visibleRutter,
  visibleRutterLanes,
  type Foliot,
  type FoliotDensity,
  type FoliotSort,
  type FoliotTray,
  type FoliotView,
  type RutterReview,
  type RutterRow,
  type RutterShape,
  type RutterValue,
} from "@/lib/crmv4/round319";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const INKS = ["GILT", "IVORY", "GRAPHITE"] as const;
const DROPS = ["3", "6", "9", "12"] as const;
const BEATS = ["1", "3", "5"] as const;

const VESSEL_KEY: Record<string, CrmV4CopyKey> = {
  bar: "fltBowl",
  bob: "fltTube",
  verge: "fltCistern",
  crown: "fltSpout",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "fltAuditSave",
  edit: "fltAuditEdit",
  note: "fltAuditNote",
  ink: "fltAuditInk",
  set: "fltAuditSet",
  clear: "fltAuditClear",
  hook: "fltAuditHook",
  resume: "fltAuditResume",
  coffer: "fltAuditCoffer",
  open: "fltAuditOpen",
  tag: "fltAuditTag",
  swing: "fltAuditSwing",
  notch: "fltAuditNotch",
  lower: "fltAuditLowerNotch",
  star: "fltAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  berth: "rtrBerth",
  splice: "rtrSplice",
  reach: "rtrReach",
  cipher: "rtrCipher",
  mark: "rtrMark",
  passage: "rtrPassage",
  inlet: "rtrInlet",
  road: "rtrRoad",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "rtrChampagne",
  ivory: "rtrIvory",
  graphite: "rtrGraphite",
};

const SHAPE_KEY: Record<RutterShape, CrmV4CopyKey> = {
  all: "rtrShapeAll",
  berth: "rtrShapeBerth",
  splice: "rtrShapeSplice",
  reach: "rtrShapeReach",
  cipher: "rtrShapeCipher",
  mark: "rtrShapeMark",
  passage: "rtrShapePassage",
  inlet: "rtrShapeInlet",
  road: "rtrShapeRoad",
  open: "rtrShapeOpen",
  soon: "rtrShapeSoon",
  letter: "rtrShapeLetter",
  mixed: "rtrShapeMixed",
  upper: "rtrShapeUpper",
  lower: "rtrShapeLower",
  space: "rtrShapeSpace",
  even: "rtrShapeEven",
  odd: "rtrShapeOdd",
  tail: "rtrShapeTail",
  first: "rtrShapeFirst",
  held: "rtrShapeHeld",
  hyphen: "rtrShapeHyphen",
  period: "rtrShapePeriod",
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

function limbLabel(v4: V4, limb: string): string {
  const key = VESSEL_KEY[limb];
  return key ? v4(key) : v4("fltBlankLimb");
}

function inkLabel(v4: V4, ink: string): string {
  if (ink === "GILT") return v4("fltGilt");
  if (ink === "IVORY") return v4("fltIvory");
  if (ink === "GRAPHITE") return v4("fltGraphite");
  return v4("fltAll");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("rtrUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("rtrUnmarked");
}

export function FoliotRules({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Foliot[]>([]);
  const [views, setViews] = useState<FoliotView[]>([]);
  const [density, setDensity] = useState<FoliotDensity>("broad");
  const [tray, setTray] = useState<FoliotTray>("bench");
  const [query, setQuery] = useState("");
  const [wardenFilter, setWardenFilter] = useState("");
  const [inkFilter, setInkFilter] = useState("all");
  const [limbFilter, setLimbFilter] = useState("all");
  const [dropFilter, setNotchFilter] = useState("all");
  const [beatFilter, setSwingFilter] = useState("all");
  const [sort, setSort] = useState<FoliotSort>("limb");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [warden, setWarden] = useState("");
  const [limb, setLimb] = useState("");
  const [ink, setInk] = useState("");
  const [dropNo, setNotchNo] = useState("");
  const [beatNo, setSwingNo] = useState("");
  const [tags, setTags] = useState("");
  const [viewName, setViewName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focusAt, setFocusAt] = useState(0);
  const [desk, setDesk] = useState("bar");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readFoliotRules(readJson(FLT_KEY, [])));
    setViews(readFoliotViews(readJson(FLT_VIEW_KEY, [])));
    setDensity(foliotDensity(readJson(FLT_DENSITY_KEY, "broad")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Foliot[]) {
    setCards(next);
    writeJson(FLT_KEY, next);
  }
  function storeViews(next: FoliotView[]) {
    setViews(next);
    writeJson(FLT_VIEW_KEY, next);
  }
  function storeDensity(next: FoliotDensity) {
    setDensity(next);
    writeJson(FLT_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortFoliotRules(visibleFoliotRules(cards, tray, query, wardenFilter, inkFilter, limbFilter, dropFilter, beatFilter), sort),
    [cards, tray, query, wardenFilter, inkFilter, limbFilter, dropFilter, beatFilter, sort],
  );
  const counts = foliotCounts(cards, shown, desk);
  const bars = foliotBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = foliotTimeline(cards);
  const wardens = foliotWardens(cards);
  const suggested = suggestInk(cards);
  const fair = fairWarden(cards, wardens.join(","));
  const busy = busiestWarden(cards);
  const reminders = reminderFoliotRules(cards);
  const dropHint = suggestNotch(cards, clock);
  const limbHint = suggestLimb(clock);
  const focused = shown[focusAt];

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setTitle("");
        setNote("");
        setWarden("");
        setLimb("");
        setInk("");
        setNotchNo("");
        setSwingNo("");
        setTags("");
        return;
      }
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocusAt((index) => moveFoliotFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocusAt((index) => moveFoliotFocus(index, shown.length, -1));
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
        store(setFoliotCoffer(cards, id, !shown[focusAt]?.coffered));
        return;
      }
      if (event.key === "m" || event.key === "M") {
        event.preventDefault();
        store(inkFocused(cards, id));
        return;
      }
      if (event.key === "c" || event.key === "C") {
        event.preventDefault();
        store(hookFoliotFocused(cards, id));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        store(setFoliotFocused(cards, id));
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("foliot-rules.csv", foliotCsv(shown, desk));
        return;
      }
      if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        store(starFoliotFocused(cards, id));
        return;
      }
      if (event.key === "u" || event.key === "U") {
        event.preventDefault();
        store(raiseSwingFocused(cards, id));
        return;
      }
      if (event.key === "d" || event.key === "D") {
        event.preventDefault();
        store(lowerSwingFocused(cards, id));
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
    <section className="c4-foliot" aria-label={v4("fltTitle")} data-cards="1" data-desk={tray} data-names="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-foliot-mast">
        <p className="c4-foliot-seal" data-logo="mono">{v4("fltLogo")}</p>
        <div>
          <p className="c4-foliot-kicker">{v4("fltSub")}</p>
          <h2 className="c4-title">{v4("fltTitle")}</h2>
        </div>
        <p className="c4-foliot-count">{counts.matched}</p>
      </header>
      <ol className="c4-foliot-index" aria-label={v4("fltTitle")}>
        <li data-tone="gold">{v4("fltBench")} {counts.bench}</li>
        <li data-tone="ink">{v4("fltOverdue")} {counts.overdue}</li>
        <li data-tone="ivory">{v4("fltHouse")} {counts.house}</li>
      </ol>
      <p className="c4-foliot-links">
        <Link href={crmv4Href(base, "rtr")}>{v4("rtrTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("fltCustomers")}</Link>
      </p>
      <p className="c4-foliot-hint">{v4("fltHint")}</p>
      {viewer && <p className="c4-foliot-note">{v4("fltViewer")}</p>}
      {counts.overdue > 0 && <p className="c4-foliot-notice" role="status">{v4("fltOverdue")} {counts.overdue}</p>}
      <ol className="c4-foliot-dials" aria-label={v4("fltChart")}>
        <li>{v4("fltBench")} {counts.bench}</li>
        <li>{v4("fltHook")} {counts.hook}</li>
        <li>{v4("fltCoffer")} {counts.coffer}</li>
        <li>{v4("fltInner")} {counts.inner}</li>
        <li>{v4("fltOuter")} {counts.outer}</li>
        <li>{v4("fltWide")} {counts.wide}</li>
        <li>{v4("fltStar")} {counts.starred}</li>
        <li>{v4("fltIdle")} {counts.idle}</li>
        <li>{v4("fltBrisk")} {counts.brisk}</li>
        <li>{v4("fltResting")} {counts.resting}</li>
      </ol>
      <div className="c4-foliot-chart" aria-label={v4("fltChart")}>
        {bars.map((bar) => (
          <button key={bar.limb} type="button" className="c4-foliot-column" data-on={limbFilter === bar.limb ? "1" : "0"} data-limb={bar.limb} onClick={() => setLimbFilter(limbFilter === bar.limb ? "all" : bar.limb)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{limbLabel(v4, bar.limb)}</span>
          </button>
        ))}
      </div>
      <div className="c4-foliot-tools">
        <input ref={searchRef} className="c4-field c4-foliot-search" aria-label={v4("fltSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("fltSearch")} />
        {(["bench", "hook", "coffer"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "bench" ? "fltBench" : item === "hook" ? "fltHook" : "fltCoffer")}</button>
        ))}
        {(["all", "inner", "outer", ...FLT_LIMBS] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={limbFilter === item ? "1" : "0"} onClick={() => setLimbFilter(item)}>{item === "all" ? v4("fltAll") : item === "inner" ? v4("fltInner") : item === "outer" ? v4("fltOuter") : limbLabel(v4, item)}</button>
        ))}
        {(["all", ...INKS] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={inkFilter === item ? "1" : "0"} onClick={() => setInkFilter(item)}>{item === "all" ? v4("fltAll") : inkLabel(v4, item)}</button>
        ))}
        {(["all", ...DROPS] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={dropFilter === item ? "1" : "0"} onClick={() => setNotchFilter(item)}>{item === "all" ? v4("fltNotch") : item}</button>
        ))}
        {(["all", ...BEATS] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={beatFilter === item ? "1" : "0"} onClick={() => setSwingFilter(item)}>{item === "all" ? v4("fltSwing") : item}</button>
        ))}
        <button type="button" className="c4-chip" data-on={sort === "limb" ? "1" : "0"} onClick={() => setSort("limb")}>{v4("fltSortLimb")}</button>
        <button type="button" className="c4-chip" data-on={sort === "warden" ? "1" : "0"} onClick={() => setSort("warden")}>{v4("fltSortWarden")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "broad" : "tight")}>{density === "tight" ? v4("fltTight") : v4("fltBroad")}</button>
        {FLT_LIMBS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={desk === item ? "1" : "0"} onClick={() => setDesk(item)}>{v4("fltDesk")} {limbLabel(v4, item)}</button>
        ))}
        {wardens.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={wardenFilter === name ? "1" : "0"} onClick={() => setWardenFilter(wardenFilter === name ? "" : name)}>{name}</button>
        ))}
      </div>
      <p className="c4-foliot-meta">{v4("fltSuggest")} {inkLabel(v4, suggested)} · {dropHint} · {limbLabel(v4, limbHint)} · {v4("fltFair")} {fair || "—"} · {v4("fltBusy")} {busy || "—"}</p>
      {reminders.length > 0 && (
        <ul className="c4-foliot-remind" aria-label={v4("fltRemind")}>
          {reminders.map((item) => <li key={item}>{item}</li>)}
        </ul>
      )}
      {timeline.length > 0 && (
        <ol className="c4-foliot-time" aria-label={v4("fltTimeline")}>
          {timeline.map((lane) => <li key={lane.notch}>{lane.notch} · {lane.titles.join(" · ")}</li>)}
        </ol>
      )}
      <form className="c4-foliot-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addFoliot(cards, { title, note, warden, limb, ink, notch: dropNo, swing: beatNo, tags });
        if (next.length === cards.length) return;
        store(next);
        setTitle("");
        setNote("");
        setTags("");
      }}>
        <input className="c4-field" aria-label={v4("fltEdit")} aria-required={false} value={title} onChange={(event) => setTitle(event.target.value)} placeholder={v4("fltEdit")} disabled={viewer} />
        <input className="c4-field" aria-label={v4("fltNote")} aria-required={false} value={note} onChange={(event) => setNote(event.target.value)} placeholder={v4("fltNote")} disabled={viewer} />
        <input className="c4-field" aria-label={v4("fltWarden")} aria-required={false} value={warden} onChange={(event) => setWarden(event.target.value)} placeholder={v4("fltWarden")} disabled={viewer} />
        <select className="c4-select" aria-label={v4("fltDesk")} value={limb} onChange={(event) => setLimb(event.target.value)} disabled={viewer}>
          <option value="">{v4("fltBlankLimb")}</option>
          {FLT_LIMBS.map((item) => <option key={item} value={item}>{limbLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("fltInk")} value={ink} onChange={(event) => setInk(event.target.value)} disabled={viewer}>
          <option value="">{v4("fltInk")}</option>
          {INKS.map((item) => <option key={item} value={item}>{inkLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("fltNotch")} value={dropNo} onChange={(event) => setNotchNo(event.target.value)} disabled={viewer}>
          <option value="">{v4("fltNotch")}</option>
          {DROPS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("fltSwing")} value={beatNo} onChange={(event) => setSwingNo(event.target.value)} disabled={viewer}>
          <option value="">{v4("fltSwing")}</option>
          {BEATS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <input className="c4-field" aria-label={v4("fltTag")} aria-required={false} value={tags} onChange={(event) => setTags(event.target.value)} placeholder={v4("fltTag")} disabled={viewer} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("fltAdd")}</button>
      </form>
      <form className="c4-foliot-views" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addFoliotView(views, { id: `v${Date.now().toString(36)}`, name: viewName, tray, query, warden: wardenFilter, ink: inkFilter, limb: limbFilter, notch: dropFilter, swing: beatFilter });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <input className="c4-field" aria-label={v4("fltViewName")} aria-required={false} value={viewName} onChange={(event) => setViewName(event.target.value)} placeholder={v4("fltViewName")} disabled={viewer} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("fltSaveView")}</button>
        {views.map((view) => (
          <span key={view.id} className="c4-foliot-view">
            <button type="button" className="c4-chip" onClick={() => { setTray(view.tray); setQuery(view.query); setWardenFilter(view.warden); setInkFilter(view.ink); setLimbFilter(view.limb); setNotchFilter(view.notch); setSwingFilter(view.swing); }}>{v4("fltApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropFoliotView(views, view.id))}>{v4("fltNotchView")}</button>
          </span>
        ))}
      </form>
      <div className="c4-foliot-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkFoliotWind(cards, picked))}>{v4("fltBulkWind")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkFoliotGraphite(cards, picked))}>{v4("fltBulkGraphite")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkFoliotCoffer(cards, picked))}>{v4("fltBulkCoffer")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkFoliotTag(cards, picked))}>{v4("fltBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("foliot-rules.csv", foliotCsv(shown, desk))}>{v4("fltCsv")}</button>
      </div>
      <p className="c4-foliot-keys">{v4("fltKeys")} j k / p o u d m c a s v x</p>
      {!shown.length && <p className="c4-pay-empty">{v4("fltEmpty")}</p>}
      <ul className="c4-foliot-list" data-density={density}>
        {shown.map((card) => {
          const auditKey = AUDIT_KEY[card.audit];
          return (
            <li key={card.id} className="c4-foliot-card" data-on={focused?.id === card.id ? "1" : "0"} data-limb={card.limb || "blank"} data-late={lateFoliot(card, desk) ? "1" : "0"} data-idle={idleFoliot(card) ? "1" : "0"} data-brisk={briskFoliot(card) ? "1" : "0"} data-resting={restingFoliot(card) ? "1" : "0"} data-overdue={overdueFoliot(card) ? "1" : "0"} data-inner={foliotInner(card.limb) ? "1" : "0"} data-outer={foliotOuter(card.limb) ? "1" : "0"}>
              <label className="c4-foliot-pick">
                <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
              </label>
              <div>
                <input className="c4-field" aria-label={v4("fltEdit")} aria-required={false} defaultValue={card.title} disabled={viewer} onBlur={(event) => store(editFoliot(cards, card.id, event.target.value))} />
                <input className="c4-field" aria-label={v4("fltNote")} aria-required={false} defaultValue={card.note} disabled={viewer} onBlur={(event) => store(editFoliotNote(cards, card.id, event.target.value))} />
                <p className="c4-foliot-meta">{card.warden || "—"} · {limbLabel(v4, card.limb)} · {inkLabel(v4, card.ink)} · {card.notch ?? "—"} · {card.swing} · {card.tags.join(" ") || "—"}</p>
                {auditKey && <p className="c4-foliot-audit">{v4(auditKey)}</p>}
              </div>
              <div className="c4-foliot-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setFoliotWind(cards, card.id, !card.wound))}>{card.wound ? v4("fltClear") : v4("fltWind")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setFoliotInk(cards, card.id, suggested))}>{v4("fltSuggest")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setFoliotHook(cards, card.id, !card.hooked))}>{card.hooked ? v4("fltUnhook") : v4("fltHookIt")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setFoliotCoffer(cards, card.id, !card.coffered))}>{card.coffered ? v4("fltUncoffer") : v4("fltCofferIt")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setFoliotStar(cards, card.id, !card.starred))}>{card.starred ? v4("fltUnstar") : v4("fltStar")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addFoliotTag(cards, card.id, "f"))}>{v4("fltTag")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(liftNotchFocused(cards, card.id))}>{v4("fltLift")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerNotchFocused(cards, card.id))}>{v4("fltLower")}</button>
                <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(foliotCopy(card))}>{v4("fltCopy")}</button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

type RutterUser = { id?: string; name?: string | null; retentionStatus?: string | null };

export function RutterPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: RutterUser[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<RutterShape>("all");
  const [review, setReview] = useState<RutterReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): RutterRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      code: { retention: textField(row.retentionStatus) } satisfies RutterValue,
    };
  }).filter((row): row is RutterRow => Boolean(row));
  const present = presentRutterLanes(rows);
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
    const next = readHiddenRutter(readJson(RTR_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(RTR_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedRutter(readJson(RTR_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(RTR_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleRutterLanes(present, hidden, showHidden);
  const shown = visibleRutter(rows, lanes.includes(lane) || lane === "all" ? lane : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = rutterLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = rutterLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingRutter(rows);
  const leadHue = leadingRutterHue(rows);
  const whole = rows.filter((row) => rutterLane(row.code)).length;
  const share = rutterShare(laneRutterCount(rows, "berth"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("rutter-lanes.csv", rutterLanesCsv(rows));
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
    writeJson(RTR_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(RTR_REVIEW_KEY, next);
  }

  return (
    <section className="c4-rutter" aria-label={v4("rtrTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-rutter-mast">
        <p className="c4-rutter-seal" data-logo="mono">{v4("rtrLogo")}</p>
        <div>
          <p className="c4-rutter-kicker">{v4("rtrSub")}</p>
          <h2 className="c4-title">{v4("rtrTitle")}</h2>
        </div>
        <p className="c4-rutter-count">{shown.length}</p>
      </header>
      <p className="c4-rutter-links">
        <Link href={crmv4Href(base, "flt")}>{v4("fltTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("rtrCustomer")}</Link>
      </p>
      <p className="c4-rutter-hint">{v4("rtrHint")}</p>
      {viewer && <p className="c4-rutter-note">{v4("rtrViewer")}</p>}
      <p className="c4-rutter-meta">{v4("rtrLead")} {laneLabel(v4, lead)} · {v4("rtrToneLead")} {hueLabel(v4, leadHue)} · {v4("rtrShare")} {share}</p>
      <div className="c4-rutter-chart" aria-label={v4("rtrChart")}>
        {lines.map((line) => (
          <button key={line.lane} type="button" className="c4-rutter-column" data-on={lane === line.lane ? "1" : "0"} data-lane={line.lane} onClick={() => setLane(lane === line.lane ? "all" : line.lane)}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-rutter-tools">
        <input ref={searchRef} className="c4-field c4-rutter-search" aria-label={v4("rtrSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("rtrSearch")} />
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("rtrShow")}</button>
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{v4(item === "all" ? "rtrAll" : item === "reviewed" ? "rtrReviewed" : "rtrFresh")}</button>
        ))}
        {(["all", "champagne", "ivory", "graphite"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("rtrAll") : hueLabel(v4, item)}</button>
        ))}
        {(Object.keys(SHAPE_KEY) as RutterShape[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" onClick={() => storeHidden(toggleRutter(hidden, item))}>{hidden.includes(item) ? v4("rtrShow") : v4("rtrHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-rutter-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkRutterReview(reviewed, picked, true))}>{v4("rtrBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkRutterReview(reviewed, picked, false))}>{v4("rtrBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("rutter-lanes.csv", rutterLanesCsv(rows))}>{v4("rtrCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("rutter-rows.csv", rutterRowsCsv(shown, reviewed))}>{v4("rtrRowCsv")}</button>
      </div>
      {queue.loading && !rows.length && <p className="c4-meta">{v4("rtrLoading")}</p>}
      {queue.error && <p className="c4-meta">{v4("rtrFailed")}</p>}
      {!queue.loading && !queue.error && !rows.length && <p className="c4-pay-empty">{v4("rtrEmpty")}</p>}
      <ul className="c4-rutter-list">
        {shown.map((row) => {
          const name = rutterCopy(row.code);
          const tone = rutterHue(row.code);
          return (
            <li key={row.id} className="c4-rutter-card" data-lane={rutterLane(row.code) || "open"} data-hue={tone || "none"} data-berth={rutterBerthSafe(row.code)} data-open={rutterOpen(row.code) ? "1" : "0"} data-even={rutterEven(row.code) ? "1" : "0"} data-cipher={rutterCipher(row.code) ? "1" : "0"} data-letter={rutterLetter(row.code) ? "1" : "0"} data-mixed={rutterMixed(row.code) ? "1" : "0"} data-upper={rutterUpper(row.code) ? "1" : "0"} data-lower={rutterLower(row.code) ? "1" : "0"} data-space={rutterSpace(row.code) ? "1" : "0"} data-inlet={rutterInlet(row.code) ? "1" : "0"} data-tail={rutterTail(row.code) ? "1" : "0"} data-first={rutterFirst(row.code) ? "1" : "0"} data-held={rutterHeld(row.code) ? "1" : "0"} data-hyphen={rutterHyphen(row.code) ? "1" : "0"} data-period={rutterPeriod(row.code) ? "1" : "0"} data-capital={rutterCapital(row.code) ? "1" : "0"} data-splice={rutterSplice(row.code) ? "1" : "0"} data-reach={rutterReach(row.code) ? "1" : "0"}>
              <label className="c4-rutter-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-rutter-meta">{name || v4("rtrOpen")} · {rutterStamp(row.code) || "—"} · {rutterFamily(row.code) || "—"} · {rutterLength(row.code) ?? "—"} · {laneLabel(v4, rutterLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-rutter-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleRutterReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("rtrReviewed") : v4("rtrReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const text = rutterCopy(row.code); if (!text) return; navigator.clipboard?.writeText(text); setCopied(row.id); }}>{copied === row.id ? v4("rtrCopied") : v4("rtrCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("rtrCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function rutterBerthSafe(raw: RutterValue): string {
  return rutterLane(raw) === "berth" ? "1" : "0";
}
