"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  GNOMON_STYLES,
  GNS_DENSITY_KEY,
  GNS_KEY,
  GNS_VIEW_KEY,
  TNR_KEY,
  TNR_REVIEW_KEY,
  addGnomon,
  addGnomonTag,
  addGnomonView,
  briskGnomon,
  bulkGnomonGilt,
  bulkGnomonLog,
  bulkGnomonStow,
  bulkGnomonTag,
  bulkTenureReview,
  busiestKeeper,
  cycleMetal,
  dipHeightFocused,
  dropGnomonView,
  editGnomon,
  editGnomonNote,
  fairKeeper,
  firmStyle,
  gnomonBars,
  gnomonCopy,
  gnomonCounts,
  gnomonCsv,
  gnomonDensity,
  gnomonKeepers,
  gnomonTimeline,
  idleGnomon,
  laneTenureCount,
  lateGnomon,
  leadingTenure,
  leadingTenureHue,
  liftHeightFocused,
  lockGnomonFocused,
  logGnomonFocused,
  lowerShadowFocused,
  metalFocused,
  moveGnomonFocus,
  overdueGnomon,
  presentTenureLanes,
  raiseShadowFocused,
  readGnomonViews,
  readGnomons,
  readHiddenTenure,
  readReviewedTenure,
  reminderGnomons,
  restingGnomon,
  setGnomonLock,
  setGnomonLogged,
  setGnomonMetal,
  setGnomonStar,
  setGnomonStow,
  sharedTenureCount,
  softStyle,
  sortGnomons,
  starGnomonFocused,
  suggestGnomonMetal,
  suggestHeight,
  suggestStyle,
  tagGnomonFocused,
  tenureCopy,
  tenureFresh,
  tenureGrove,
  tenureHue,
  tenureLane,
  tenureLanes,
  tenureLanesCsv,
  tenureLeap,
  tenureLong,
  tenureMark,
  tenureMonth,
  tenureOdd,
  tenureQuiet,
  tenureRowsCsv,
  tenureShare,
  tenureSpace,
  tenureSpan,
  tenureStamp,
  tenureStep,
  tenureTail,
  tenureToday,
  tenureTwin,
  toggleTenure,
  toggleTenureReview,
  visibleGnomons,
  visibleTenure,
  visibleTenureLanes,
  type Gnomon,
  type GnomonDensity,
  type GnomonSort,
  type GnomonTray,
  type GnomonView,
  type TenureReview,
  type TenureRow,
  type TenureShape,
  type TenureValue,
} from "@/lib/crmv4/round287";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

type OpenedRow = { id?: string; name?: string | null; createdAt?: string | null };

const METALS = ["ASH", "BRASS", "GILT"] as const;
const HEIGHTS = ["3", "5", "9"] as const;
const SHADOWS = ["1", "2", "4"] as const;
const SHAPES: TenureShape[] = ["all", "fresh", "grove", "quiet", "today", "month", "odd", "leap", "span", "long", "twin", "tail", "mark", "space", "sprout", "sapling", "timber"];

const STYLE_KEY: Record<string, CrmV4CopyKey> = {
  lawn: "gnsLawn",
  wall: "gnsWall",
  roof: "gnsRoof",
  pier: "gnsPier",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "gnsAuditSave",
  edit: "gnsAuditEdit",
  note: "gnsAuditNote",
  metal: "gnsAuditMetal",
  log: "gnsAuditLog",
  unlog: "gnsAuditUnlog",
  lock: "gnsAuditLock",
  resume: "gnsAuditResume",
  stow: "gnsAuditStow",
  open: "gnsAuditOpen",
  tag: "gnsAuditTag",
  shadow: "gnsAuditShadow",
  height: "gnsAuditHeight",
  dip: "gnsAuditDip",
  star: "gnsAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  fresh: "tnrFresh",
  sprout: "tnrSprout",
  sapling: "tnrSapling",
  timber: "tnrTimber",
  grove: "tnrGrove",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  ivory: "tnrIvory",
  graphite: "tnrGraphite",
  champagne: "tnrChampagne",
};

const SHAPE_KEY: Record<TenureShape, CrmV4CopyKey> = {
  all: "tnrShapeAll",
  fresh: "tnrShapeFresh",
  grove: "tnrShapeGrove",
  quiet: "tnrShapeQuiet",
  today: "tnrShapeToday",
  month: "tnrShapeMonth",
  odd: "tnrShapeOdd",
  leap: "tnrShapeLeap",
  span: "tnrShapeSpan",
  long: "tnrShapeLong",
  twin: "tnrShapeTwin",
  tail: "tnrShapeTail",
  mark: "tnrShapeMark",
  space: "tnrShapeSpace",
  sprout: "tnrShapeSprout",
  sapling: "tnrShapeSapling",
  timber: "tnrShapeTimber",
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

function styleLabel(v4: V4, style: string): string {
  const key = STYLE_KEY[style];
  return key ? v4(key) : v4("gnsBlankStyle");
}

function metalLabel(v4: V4, metal: string): string {
  if (metal === "ASH") return v4("gnsAsh");
  if (metal === "BRASS") return v4("gnsBrass");
  if (metal === "GILT") return v4("gnsGilt");
  return v4("gnsAll");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("tnrUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("tnrUnmarked");
}

export function GnomonStaffs({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Gnomon[]>([]);
  const [views, setViews] = useState<GnomonView[]>([]);
  const [density, setDensity] = useState<GnomonDensity>("open");
  const [tray, setTray] = useState<GnomonTray>("green");
  const [query, setQuery] = useState("");
  const [keeperFilter, setKeeperFilter] = useState("");
  const [metalFilter, setMetalFilter] = useState("all");
  const [styleFilter, setStyleFilter] = useState("all");
  const [heightFilter, setHeightFilter] = useState("all");
  const [shadowFilter, setShadowFilter] = useState("all");
  const [sort, setSort] = useState<GnomonSort>("style");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [keeper, setKeeper] = useState("");
  const [style, setStyle] = useState("");
  const [metal, setMetal] = useState("");
  const [heightNo, setHeightNo] = useState("");
  const [shadowNo, setShadowNo] = useState("");
  const [tags, setTags] = useState("");
  const [viewName, setViewName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focusAt, setFocusAt] = useState(0);
  const [desk, setDesk] = useState("lawn");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readGnomons(readJson(GNS_KEY, [])));
    setViews(readGnomonViews(readJson(GNS_VIEW_KEY, [])));
    setDensity(gnomonDensity(readJson(GNS_DENSITY_KEY, "open")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Gnomon[]) {
    setCards(next);
    writeJson(GNS_KEY, next);
  }
  function storeViews(next: GnomonView[]) {
    setViews(next);
    writeJson(GNS_VIEW_KEY, next);
  }
  function storeDensity(next: GnomonDensity) {
    setDensity(next);
    writeJson(GNS_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortGnomons(visibleGnomons(cards, tray, query, keeperFilter, metalFilter, styleFilter, heightFilter, shadowFilter), sort),
    [cards, tray, query, keeperFilter, metalFilter, styleFilter, heightFilter, shadowFilter, sort],
  );
  const counts = gnomonCounts(cards, shown, desk);
  const bars = gnomonBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = gnomonTimeline(cards);
  const keepers = gnomonKeepers(cards);
  const ids = shown.map((card) => card.id);
  const suggested = suggestGnomonMetal(cards);
  const fair = fairKeeper(cards, keepers.join(","));
  const busy = busiestKeeper(cards);
  const reminders = reminderGnomons(cards);
  const heightHint = suggestHeight(cards, clock);
  const styleHint = suggestStyle(clock);
  const focused = shown[focusAt];

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setTitle("");
        setNote("");
        setKeeper("");
        setStyle("");
        setMetal("");
        setHeightNo("");
        setShadowNo("");
        setTags("");
        return;
      }
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocusAt((index) => moveGnomonFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocusAt((index) => moveGnomonFocus(index, shown.length, -1));
        return;
      }
      if (viewer) return;
      const id = shown[focusAt]?.id || "";
      if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        store(liftHeightFocused(cards, id));
        return;
      }
      if (event.key === "c" || event.key === "C") {
        event.preventDefault();
        store(setGnomonStow(cards, id, !shown[focusAt]?.stowed));
        return;
      }
      if (event.key === "g" || event.key === "G") {
        event.preventDefault();
        store(metalFocused(cards, id));
        return;
      }
      if (event.key === "l" || event.key === "L") {
        event.preventDefault();
        store(lockGnomonFocused(cards, id));
        return;
      }
      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        store(logGnomonFocused(cards, id));
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("gnomon-staffs.csv", gnomonCsv(shown, desk));
        return;
      }
      if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        store(starGnomonFocused(cards, id));
        return;
      }
      if (event.key === "u" || event.key === "U") {
        event.preventDefault();
        store(raiseShadowFocused(cards, id));
        return;
      }
      if (event.key === "y" || event.key === "Y") {
        event.preventDefault();
        store(lowerShadowFocused(cards, id));
        return;
      }
      if (event.key === "d" || event.key === "D") {
        event.preventDefault();
        store(dipHeightFocused(cards, id));
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
    <section className="c4-gnomon" aria-label={v4("gnsTitle")} data-cards="1" data-desk={tray} data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-gnomon-mast">
        <p className="c4-gnomon-seal" data-logo="mono">{v4("gnsLogo")}</p>
        <div>
          <p className="c4-gnomon-kicker">{v4("gnsSub")}</p>
          <h2 className="c4-title">{v4("gnsTitle")}</h2>
        </div>
        <ol className="c4-gnomon-index" aria-label={v4("gnsTitle")}>
          <li data-tone="gold">{v4("gnsGilt")}</li>
          <li data-tone="ink">{v4("gnsBrass")}</li>
          <li data-tone="ivory">{v4("gnsAsh")}</li>
        </ol>
      </header>
      <p className="c4-gnomon-links">
        <Link href={crmv4Href(base, "tnr")}>{v4("tnrTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("gnsCustomers")}</Link>
        <Link href={crmv4Href(base, "edge")}>{v4("egGiltKicker")}</Link>
      </p>
      <p className="c4-gnomon-hint">{v4("gnsHint")}</p>
      {viewer && <p className="c4-gnomon-note">{v4("gnsViewer")}</p>}
      {counts.overdue > 0 && <p className="c4-gnomon-notice" role="status">{v4("gnsOverdue")} {counts.overdue}</p>}
      <ol className="c4-gnomon-dials" aria-label={v4("gnsChart")}>
        <li><span>{v4("gnsGreen")}</span><strong>{counts.green}</strong></li>
        <li><span>{v4("gnsCloset")}</span><strong>{counts.closet}</strong></li>
        <li><span>{v4("gnsAttic")}</span><strong>{counts.attic}</strong></li>
        <li><span>{v4("gnsOverdue")}</span><strong>{counts.overdue}</strong></li>
        <li><span>{v4("gnsIdle")}</span><strong>{counts.idle}</strong></li>
        <li><span>{v4("gnsBrisk")}</span><strong>{counts.brisk}</strong></li>
        <li><span>{v4("gnsFair")}</span><strong>{fair || "·"}</strong></li>
        <li><span>{v4("gnsBusy")}</span><strong>{busy || "·"}</strong></li>
      </ol>
      <div className="c4-gnomon-chart" aria-label={v4("gnsChart")}>
        {bars.map((bar) => (
          <button key={bar.style} type="button" className="c4-gnomon-column" data-on={styleFilter === bar.style ? "1" : "0"} data-style={bar.style} onClick={() => setStyleFilter(styleFilter === bar.style ? "all" : bar.style)}>
            <i style={{ height: `${Math.max(8, Math.round((bar.count / peak) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{styleLabel(v4, bar.style)}</span>
          </button>
        ))}
      </div>
      <div className="c4-gnomon-tools">
        <input ref={searchRef} className="c4-field c4-gnomon-search" aria-label={v4("gnsSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("gnsSearch")} />
        {(["green", "closet", "attic"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "green" ? "gnsGreen" : item === "closet" ? "gnsCloset" : "gnsAttic")}</button>
        ))}
        {(["all", "firm", "soft", ...GNOMON_STYLES] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={styleFilter === item ? "1" : "0"} onClick={() => setStyleFilter(item)}>{item === "all" ? v4("gnsAll") : item === "firm" ? v4("gnsFirm") : item === "soft" ? v4("gnsSoft") : styleLabel(v4, item)}</button>
        ))}
        {["all", ...METALS].map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={metalFilter === item ? "1" : "0"} onClick={() => setMetalFilter(item)}>{item === "all" ? v4("gnsMetal") : metalLabel(v4, item)}</button>
        ))}
        {["all", ...HEIGHTS].map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={heightFilter === item ? "1" : "0"} onClick={() => setHeightFilter(item)}>{item === "all" ? v4("gnsHeight") : item}</button>
        ))}
        {["all", ...SHADOWS].map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shadowFilter === item ? "1" : "0"} onClick={() => setShadowFilter(item)}>{item === "all" ? v4("gnsShadow") : item}</button>
        ))}
        <button type="button" className="c4-chip" data-on={sort === "keeper" ? "1" : "0"} onClick={() => setSort(sort === "style" ? "keeper" : "style")}>{sort === "style" ? v4("gnsSortStyle") : v4("gnsSortKeeper")}</button>
        <button type="button" className="c4-chip" data-on={density === "close" ? "1" : "0"} onClick={() => storeDensity(density === "open" ? "close" : "open")}>{density === "open" ? v4("gnsOpen") : v4("gnsClose")}</button>
        <button type="button" className="c4-btn" onClick={() => download("gnomon-staffs.csv", gnomonCsv(shown, desk))}>{v4("gnsCsv")}</button>
      </div>
      <div className="c4-gnomon-tools" role="group" aria-label={v4("gnsDesk")}>
        {GNOMON_STYLES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={desk === item ? "1" : "0"} onClick={() => setDesk(item)}>{v4("gnsDesk")} {styleLabel(v4, item)}</button>
        ))}
        <span className="c4-gnomon-meta">{v4("gnsSuggest")} {metalLabel(v4, suggested)} · {heightHint} · {styleLabel(v4, styleHint)}</span>
      </div>
      <form className="c4-gnomon-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addGnomon(cards, { title, note, keeper, style, metal: metal || suggested, height: heightNo, shadow: shadowNo, tags });
        if (next.length === cards.length) return;
        store(next);
        setTitle("");
        setNote("");
        setTags("");
      }}>
        <input className="c4-field" aria-label={v4("gnsEdit")} aria-required={false} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} placeholder={v4("gnsTitle")} />
        <input className="c4-field" aria-label={v4("gnsNote")} aria-required={false} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} placeholder={v4("gnsNote")} />
        <input className="c4-field" aria-label={v4("gnsKeeper")} aria-required={false} value={keeper} disabled={viewer} onChange={(event) => setKeeper(event.target.value)} placeholder={v4("gnsKeeper")} />
        <select className="c4-select" aria-label={v4("gnsStyle")} value={style} disabled={viewer} onChange={(event) => setStyle(event.target.value)}>
          <option value="">{v4("gnsBlankStyle")}</option>
          {GNOMON_STYLES.map((item) => <option key={item} value={item}>{styleLabel(v4, item)}</option>)}
        </select>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("gnsAdd")}</button>
      </form>
      <form className="c4-gnomon-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addGnomonView(views, { id: `v${Date.now().toString(36)}`, name: viewName, tray, query, keeper: keeperFilter, metal: metalFilter, style: styleFilter, height: heightFilter, shadow: shadowFilter });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <input className="c4-field" aria-label={v4("gnsViewName")} aria-required={false} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} placeholder={v4("gnsViewName")} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("gnsSaveView")}</button>
      </form>
      <ul className="c4-gnomon-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setKeeperFilter(view.keeper); setMetalFilter(view.metal); setStyleFilter(view.style); setHeightFilter(view.height); setShadowFilter(view.shadow); }}>{v4("gnsApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropGnomonView(views, view.id))}>{v4("gnsDrop")}</button>
          </li>
        ))}
      </ul>
      {picked.length > 0 && (
        <div className="c4-gnomon-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkGnomonGilt(cards, picked))}>{v4("gnsBulkGilt")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkGnomonLog(cards, picked))}>{v4("gnsBulkLog")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkGnomonStow(cards, picked))}>{v4("gnsBulkStow")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkGnomonTag(cards, picked))}>{v4("gnsBulkTag")}</button>
        </div>
      )}
      <p className="c4-gnomon-meta">{v4("gnsKeys")} · j k n l g c s d r u y x /</p>
      {timeline.length > 0 && (
        <ol className="c4-gnomon-time" aria-label={v4("gnsTimeline")}>
          {timeline.map((lane) => (
            <li key={lane.height}><span>{v4("gnsHeight")} {lane.height}</span><strong>{lane.titles.join(" · ")}</strong></li>
          ))}
        </ol>
      )}
      {reminders.length > 0 && <p className="c4-gnomon-meta">{v4("gnsRemind")} {reminders.join(" · ")}</p>}
      {!shown.length && <p className="c4-gnomon-empty">{v4("gnsEmpty")}</p>}
      <ol className="c4-gnomon-board">
        {shown.map((card, index) => {
          const on = index === focusAt;
          return (
            <li key={card.id} className="c4-gnomon-card" data-on={on ? "1" : "0"} data-overdue={overdueGnomon(card) ? "1" : "0"} data-idle={idleGnomon(card) ? "1" : "0"} data-brisk={briskGnomon(card) ? "1" : "0"} data-resting={restingGnomon(card) ? "1" : "0"} data-late={lateGnomon(card, desk) ? "1" : "0"} data-soft={softStyle(card.style) ? "1" : "0"} data-firm={firmStyle(card.style) ? "1" : "0"} data-star={card.flagged ? "1" : "0"}>
              <label className="c4-gnomon-pick"><input type="checkbox" checked={picked.includes(card.id)} aria-label={card.title} onChange={() => setPicked((current) => (current.includes(card.id) ? current.filter((item) => item !== card.id) : [...current, card.id]))} /></label>
              <div>
                {on && !viewer ? (
                  <input className="c4-field" aria-label={v4("gnsEdit")} aria-required={false} value={card.title} onChange={(event) => store(editGnomon(cards, card.id, event.target.value))} />
                ) : (
                  <strong>{card.title}</strong>
                )}
                <p className="c4-gnomon-meta">{card.keeper || v4("gnsKeeper")} · {styleLabel(v4, card.style)} · {metalLabel(v4, card.metal)} · {card.height ?? "·"} · {v4("gnsShadow")} {card.shadow}{card.tags.length ? ` · ${card.tags.join("")}` : ""}{card.audit ? ` · ${AUDIT_KEY[card.audit] ? v4(AUDIT_KEY[card.audit]) : card.audit}` : ""}</p>
                {on && !viewer ? (
                  <input className="c4-field" aria-label={v4("gnsNote")} aria-required={false} value={card.note} onChange={(event) => store(editGnomonNote(cards, card.id, event.target.value))} />
                ) : (
                  card.note && <p className="c4-gnomon-meta">{card.note}</p>
                )}
                <div className="c4-gnomon-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setGnomonLogged(cards, card.id, !card.logged))}>{card.logged ? v4("gnsUnlog") : v4("gnsLog")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setGnomonLock(cards, card.id, !card.locked))}>{card.locked ? v4("gnsUnlock") : v4("gnsLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setGnomonStow(cards, card.id, !card.stowed))}>{card.stowed ? v4("gnsUnstow") : v4("gnsStow")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setGnomonStar(cards, card.id, !card.flagged))}>{card.flagged ? v4("gnsUnstar") : v4("gnsStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setGnomonMetal(cards, card.id, cycleMetal(card.metal)))}>{v4("gnsMetal")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(liftHeightFocused(cards, card.id))}>{v4("gnsLift")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(dipHeightFocused(cards, card.id))}>{v4("gnsDip")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseShadowFocused(cards, card.id))}>{v4("gnsShadow")}+</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerShadowFocused(cards, card.id))}>{v4("gnsShadow")}−</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addGnomonTag(cards, card.id, "x"))}>{v4("gnsTag")} x</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(tagGnomonFocused(cards, card.id))}>{v4("gnsTag")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(gnomonCopy(card)); }}>{v4("tnrCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="c4-gnomon-meta">{v4("gnsMatched")} {counts.matched} · {ids.length}</p>
    </section>
  );
}

export function TenurePlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: OpenedRow[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<TenureShape>("all");
  const [review, setReview] = useState<TenureReview>("all");
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

  const rows = useMemo<TenureRow[]>(() => {
    return (queue.data?.users || []).map((row, index) => ({
      id: textField(row.id) || `t${index}`,
      label: textField(row.name),
      opened: { createdAt: textField(row.createdAt) } satisfies TenureValue,
    }));
  }, [queue.data]);

  useEffect(() => {
    const ids = rows.map((row) => row.id);
    const clock = Date.now();
    setHidden(readHiddenTenure(readJson(TNR_KEY, []), presentTenureLanes(rows, clock)));
    setReviewed(readReviewedTenure(readJson(TNR_REVIEW_KEY, []), ids));
  }, [rows]);

  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(TNR_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(TNR_REVIEW_KEY, next);
  }

  const lanes = visibleTenureLanes(presentTenureLanes(rows, now), hidden, showHidden);
  const shown = visibleTenure(rows, lane, hue, query, review, reviewed, shape, now).filter((row) => !hidden.includes(tenureLane(row.opened, now)) || showHidden);
  const bars = tenureLanes(rows, now);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const lead = leadingTenure(rows, now);
  const leadHue = leadingTenureHue(rows, now);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocusAt((index) => moveGnomonFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocusAt((index) => moveGnomonFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "m" || event.key === "M") {
        event.preventDefault();
        if (viewer) return;
        const id = shown[focusAt]?.id;
        if (id) storeReviewed(toggleTenureReview(reviewed, id));
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
    <section className="c4-tenure" aria-label={v4("tnrTitle")} data-plates="1" data-names={rows.length} data-role={role}>
      <header className="c4-tenure-mast">
        <p className="c4-tenure-seal" data-logo="mono">{v4("tnrLogo")}</p>
        <div>
          <p className="c4-tenure-kicker">{v4("tnrSub")}</p>
          <h2 className="c4-title">{v4("tnrTitle")}</h2>
        </div>
      </header>
      <ol className="c4-tenure-index" aria-label={v4("tnrTitle")}>
        <li data-tone="gold">{v4("tnrFresh")}</li>
        <li data-tone="ink">{v4("tnrGrove")}</li>
        <li data-tone="ivory">{v4("tnrSapling")}</li>
        <li data-tone="mist">{v4("tnrSprout")}</li>
        <li data-tone="line">{v4("tnrTimber")}</li>
      </ol>
      <p className="c4-tenure-links">
        <Link href={crmv4Href(base, "gns")}>{v4("gnsTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("gnsCustomers")}</Link>
        <Link href={crmv4Href(base, "outcomes")}>{v4("ocIvoryKicker")}</Link>
      </p>
      <p className="c4-tenure-hint">{v4("tnrHint")}</p>
      {viewer && <p className="c4-tenure-note">{v4("tnrViewer")}</p>}
      {queue.loading && <p className="c4-tenure-meta">{v4("tnrEmpty")}</p>}
      {queue.error && <p className="c4-tenure-meta">{queue.error}</p>}
      <ul className="c4-tenure-kpis" aria-label={v4("tnrRules")}>
        <li><span>{v4("tnrLead")}</span><strong>{lead ? laneLabel(v4, lead) : v4("tnrUnmarked")}</strong></li>
        <li><span>{v4("tnrToneLead")}</span><strong>{leadHue ? hueLabel(v4, leadHue) : v4("tnrUnmarked")}</strong></li>
        <li><span>{v4("tnrFresh")}</span><strong>{laneTenureCount(rows, "fresh", now)}</strong></li>
        <li><span>{v4("tnrGrove")}</span><strong>{laneTenureCount(rows, "grove", now)}</strong></li>
        <li><span>{v4("tnrShare")}</span><strong>{tenureShare(laneTenureCount(rows, "grove", now), Math.max(1, rows.length))}%</strong></li>
        <li><span>{v4("tnrQuiet")}</span><strong>{rows.filter((row) => tenureQuiet(row.opened)).length}</strong></li>
        <li><span>{v4("tnrToday")}</span><strong>{rows.filter((row) => tenureToday(row.opened, now)).length}</strong></li>
        <li><span>{v4("tnrTwin")}</span><strong>{sharedTenureCount(rows, now)}</strong></li>
      </ul>
      <div className="c4-tenure-chart" aria-label={v4("tnrRules")}>
        {bars.map((bar) => (
          <button key={bar.lane} type="button" className="c4-tenure-column" data-on={lane === bar.lane ? "1" : "0"} data-lane={bar.lane} onClick={() => setLane(lane === bar.lane ? "all" : bar.lane)}>
            <i style={{ height: `${Math.max(12, Math.round((bar.count / maxBar) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{laneLabel(v4, bar.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-tenure-tools">
        <input ref={searchRef} className="c4-field c4-tenure-search" aria-label={v4("tnrSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("tnrSearch")} />
        {(["all", "ivory", "graphite", "champagne"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("tnrAll") : hueLabel(v4, item)}</button>
        ))}
        {SHAPES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{item === "all" ? v4("tnrAll") : item === "reviewed" ? v4("tnrReviewed") : v4("tnrFreshCut")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("tnrShow")}</button>
        <button type="button" className="c4-btn" onClick={() => download("tenure-lanes.csv", tenureLanesCsv(rows, now))}>{v4("tnrCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("tenure-rows.csv", tenureRowsCsv(rows, reviewed, now))}>{v4("tnrRowCsv")}</button>
      </div>
      <ul className="c4-tenure-lanes">
        {lanes.map((item) => (
          <li key={item}>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(toggleTenure(hidden, item))}>{hidden.includes(item) ? v4("tnrShow") : v4("tnrHide")} {laneLabel(v4, item)}</button>
          </li>
        ))}
      </ul>
      {picked.length > 0 && (
        <div className="c4-tenure-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkTenureReview(reviewed, picked, true))}>{v4("tnrBulkReview")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkTenureReview(reviewed, picked, false))}>{v4("tnrBulkClear")}</button>
        </div>
      )}
      {!shown.length && <p className="c4-tenure-empty">{v4("tnrEmpty")}</p>}
      <ol className="c4-tenure-board">
        {shown.map((row, index) => {
          const seen = reviewed.includes(row.id);
          return (
            <li key={row.id} className="c4-tenure-card" data-on={index === focusAt ? "1" : "0"} data-lane={tenureLane(row.opened, now)} data-hue={tenureHue(row.opened, now)} data-reviewed={seen ? "1" : "0"} data-fresh={tenureFresh(row.opened, now) ? "1" : "0"} data-grove={tenureGrove(row.opened, now) ? "1" : "0"} data-today={tenureToday(row.opened, now) ? "1" : "0"} data-month={tenureMonth(row.opened, now) ? "1" : "0"}>
              <p className="c4-tenure-stamp">{tenureStamp(row.opened, now) || "·"}</p>
              <label className="c4-tenure-pick"><input type="checkbox" checked={picked.includes(row.id)} aria-label={row.label || row.id} onChange={() => setPicked((current) => (current.includes(row.id) ? current.filter((item) => item !== row.id) : [...current, row.id]))} /></label>
              <div>
                <strong>{row.label || v4("tnrUnmarked")}</strong>
                <p className="c4-tenure-meta">{laneLabel(v4, tenureLane(row.opened, now))} · {hueLabel(v4, tenureHue(row.opened, now))} · {v4("tnrStep")} {tenureStep(row.opened, now)}{tenureOdd(row.opened, now) ? ` · ${v4("tnrOdd")}` : ""}{tenureLeap(row.opened, now) ? ` · ${v4("tnrLeap")}` : ""}{tenureSpan(row.opened, now) ? ` · ${v4("tnrSpan")}` : ""}{tenureLong(row.opened, now) ? ` · ${v4("tnrLong")}` : ""}{tenureTwin(row.opened, now) ? ` · ${v4("tnrTwin")}` : ""}{tenureTail(row.opened) ? ` · ${v4("tnrTail")}` : ""}{tenureMark(row.opened) ? ` · ${v4("tnrMark")}` : ""}{tenureSpace(row.opened) ? ` · ${v4("tnrSpace")}` : ""}{tenureQuiet(row.opened) ? ` · ${v4("tnrQuiet")}` : ""}{tenureMonth(row.opened, now) ? ` · ${v4("tnrMonth")}` : ""}</p>
                <div className="c4-tenure-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleTenureReview(reviewed, row.id))}>{seen ? v4("tnrReviewed") : v4("tnrReview")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(tenureCopy(row.opened)); setCopied(row.id); }}>{copied === row.id ? v4("tnrCopied") : v4("tnrCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
