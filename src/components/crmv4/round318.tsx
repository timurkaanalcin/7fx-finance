"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  CKY_DENSITY_KEY,
  CKY_KEY,
  CKY_VESSELS,
  CKY_VIEW_KEY,
  PTL_KEY,
  PTL_REVIEW_KEY,
  addClepsydra,
  addClepsydraTag,
  addClepsydraView,
  briskClepsydra,
  bulkClepsydraCasket,
  bulkClepsydraGraphite,
  bulkClepsydraRun,
  bulkClepsydraTag,
  bulkPortolanReview,
  busiestKeeper,
  clepsydraBars,
  clepsydraCopy,
  clepsydraCounts,
  clepsydraCsv,
  clepsydraDensity,
  clepsydraInner,
  clepsydraKeepers,
  clepsydraOuter,
  clepsydraTimeline,
  dropClepsydraView,
  editClepsydra,
  editClepsydraNote,
  fairKeeper,
  idleClepsydra,
  inkFocused,
  lanePortolanCount,
  lateClepsydra,
  leadingPortolan,
  leadingPortolanHue,
  liftDropFocused,
  lowerBeatFocused,
  lowerDropFocused,
  moveClepsydraFocus,
  overdueClepsydra,
  pegClepsydraFocused,
  portolanBay,
  portolanCapital,
  portolanChannel,
  portolanCipher,
  portolanCopy,
  portolanEven,
  portolanFamily,
  portolanFirst,
  portolanHeld,
  portolanHue,
  portolanHyphen,
  portolanLane,
  portolanLanes,
  portolanLanesCsv,
  portolanLength,
  portolanLetter,
  portolanLower,
  portolanMixed,
  portolanMouth,
  portolanOpen,
  portolanPeriod,
  portolanRowsCsv,
  portolanShare,
  portolanSpace,
  portolanStamp,
  portolanTail,
  portolanUpper,
  presentPortolanLanes,
  raiseBeatFocused,
  readClepsydraRules,
  readClepsydraViews,
  readHiddenPortolan,
  readReviewedPortolan,
  reminderClepsydraRules,
  restingClepsydra,
  setClepsydraCasket,
  setClepsydraFocused,
  setClepsydraInk,
  setClepsydraPeg,
  setClepsydraRun,
  setClepsydraStar,
  sortClepsydraRules,
  starClepsydraFocused,
  suggestDrop,
  suggestInk,
  suggestVessel,
  togglePortolan,
  togglePortolanReview,
  visibleClepsydraRules,
  visiblePortolan,
  visiblePortolanLanes,
  type Clepsydra,
  type ClepsydraDensity,
  type ClepsydraSort,
  type ClepsydraTray,
  type ClepsydraView,
  type PortolanReview,
  type PortolanRow,
  type PortolanShape,
  type PortolanValue,
} from "@/lib/crmv4/round318";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const INKS = ["GILT", "IVORY", "GRAPHITE"] as const;
const DROPS = ["4", "8", "12", "24"] as const;
const BEATS = ["2", "4", "8"] as const;

const VESSEL_KEY: Record<string, CrmV4CopyKey> = {
  bowl: "ckyBowl",
  tube: "ckyTube",
  cistern: "ckyCistern",
  spout: "ckySpout",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "ckyAuditSave",
  edit: "ckyAuditEdit",
  note: "ckyAuditNote",
  ink: "ckyAuditInk",
  set: "ckyAuditSet",
  clear: "ckyAuditClear",
  peg: "ckyAuditPeg",
  resume: "ckyAuditResume",
  casket: "ckyAuditCasket",
  open: "ckyAuditOpen",
  tag: "ckyAuditTag",
  beat: "ckyAuditBeat",
  drop: "ckyAuditDrop",
  lower: "ckyAuditLowerDrop",
  star: "ckyAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  quay: "ptlQuay",
  channel: "ptlChannel",
  bay: "ptlBay",
  cipher: "ptlCipher",
  buoy: "ptlBuoy",
  ocean: "ptlOcean",
  mouth: "ptlMouth",
  harbor: "ptlHarbor",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "ptlChampagne",
  ivory: "ptlIvory",
  graphite: "ptlGraphite",
};

const SHAPE_KEY: Record<PortolanShape, CrmV4CopyKey> = {
  all: "ptlShapeAll",
  quay: "ptlShapeQuay",
  channel: "ptlShapeChannel",
  bay: "ptlShapeBay",
  cipher: "ptlShapeCipher",
  buoy: "ptlShapeBuoy",
  ocean: "ptlShapeOcean",
  mouth: "ptlShapeMouth",
  harbor: "ptlShapeHarbor",
  open: "ptlShapeOpen",
  soon: "ptlShapeSoon",
  letter: "ptlShapeLetter",
  mixed: "ptlShapeMixed",
  upper: "ptlShapeUpper",
  lower: "ptlShapeLower",
  space: "ptlShapeSpace",
  even: "ptlShapeEven",
  odd: "ptlShapeOdd",
  tail: "ptlShapeTail",
  first: "ptlShapeFirst",
  held: "ptlShapeHeld",
  hyphen: "ptlShapeHyphen",
  period: "ptlShapePeriod",
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

function vesselLabel(v4: V4, vessel: string): string {
  const key = VESSEL_KEY[vessel];
  return key ? v4(key) : v4("ckyBlankVessel");
}

function inkLabel(v4: V4, ink: string): string {
  if (ink === "GILT") return v4("ckyGilt");
  if (ink === "IVORY") return v4("ckyIvory");
  if (ink === "GRAPHITE") return v4("ckyGraphite");
  return v4("ckyAll");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("ptlUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("ptlUnmarked");
}

export function ClepsydraRules({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Clepsydra[]>([]);
  const [views, setViews] = useState<ClepsydraView[]>([]);
  const [density, setDensity] = useState<ClepsydraDensity>("broad");
  const [tray, setTray] = useState<ClepsydraTray>("basin");
  const [query, setQuery] = useState("");
  const [keeperFilter, setKeeperFilter] = useState("");
  const [inkFilter, setInkFilter] = useState("all");
  const [vesselFilter, setVesselFilter] = useState("all");
  const [dropFilter, setDropFilter] = useState("all");
  const [beatFilter, setBeatFilter] = useState("all");
  const [sort, setSort] = useState<ClepsydraSort>("vessel");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [keeper, setKeeper] = useState("");
  const [vessel, setVessel] = useState("");
  const [ink, setInk] = useState("");
  const [dropNo, setDropNo] = useState("");
  const [beatNo, setBeatNo] = useState("");
  const [tags, setTags] = useState("");
  const [viewName, setViewName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focusAt, setFocusAt] = useState(0);
  const [desk, setDesk] = useState("bowl");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readClepsydraRules(readJson(CKY_KEY, [])));
    setViews(readClepsydraViews(readJson(CKY_VIEW_KEY, [])));
    setDensity(clepsydraDensity(readJson(CKY_DENSITY_KEY, "broad")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Clepsydra[]) {
    setCards(next);
    writeJson(CKY_KEY, next);
  }
  function storeViews(next: ClepsydraView[]) {
    setViews(next);
    writeJson(CKY_VIEW_KEY, next);
  }
  function storeDensity(next: ClepsydraDensity) {
    setDensity(next);
    writeJson(CKY_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortClepsydraRules(visibleClepsydraRules(cards, tray, query, keeperFilter, inkFilter, vesselFilter, dropFilter, beatFilter), sort),
    [cards, tray, query, keeperFilter, inkFilter, vesselFilter, dropFilter, beatFilter, sort],
  );
  const counts = clepsydraCounts(cards, shown, desk);
  const bars = clepsydraBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = clepsydraTimeline(cards);
  const keepers = clepsydraKeepers(cards);
  const suggested = suggestInk(cards);
  const fair = fairKeeper(cards, keepers.join(","));
  const busy = busiestKeeper(cards);
  const reminders = reminderClepsydraRules(cards);
  const dropHint = suggestDrop(cards, clock);
  const vesselHint = suggestVessel(clock);
  const focused = shown[focusAt];

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setTitle("");
        setNote("");
        setKeeper("");
        setVessel("");
        setInk("");
        setDropNo("");
        setBeatNo("");
        setTags("");
        return;
      }
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocusAt((index) => moveClepsydraFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocusAt((index) => moveClepsydraFocus(index, shown.length, -1));
        return;
      }
      if (viewer) return;
      const id = shown[focusAt]?.id || "";
      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        store(liftDropFocused(cards, id));
        return;
      }
      if (event.key === "v" || event.key === "V") {
        event.preventDefault();
        store(setClepsydraCasket(cards, id, !shown[focusAt]?.casketed));
        return;
      }
      if (event.key === "m" || event.key === "M") {
        event.preventDefault();
        store(inkFocused(cards, id));
        return;
      }
      if (event.key === "c" || event.key === "C") {
        event.preventDefault();
        store(pegClepsydraFocused(cards, id));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        store(setClepsydraFocused(cards, id));
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("clepsydra-rules.csv", clepsydraCsv(shown, desk));
        return;
      }
      if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        store(starClepsydraFocused(cards, id));
        return;
      }
      if (event.key === "u" || event.key === "U") {
        event.preventDefault();
        store(raiseBeatFocused(cards, id));
        return;
      }
      if (event.key === "d" || event.key === "D") {
        event.preventDefault();
        store(lowerBeatFocused(cards, id));
        return;
      }
      if (event.key === "o" || event.key === "O") {
        event.preventDefault();
        store(lowerDropFocused(cards, id));
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
    <section className="c4-clepsydra" aria-label={v4("ckyTitle")} data-cards="1" data-desk={tray} data-names="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-clepsydra-mast">
        <p className="c4-clepsydra-seal" data-logo="mono">{v4("ckyLogo")}</p>
        <div>
          <p className="c4-clepsydra-kicker">{v4("ckySub")}</p>
          <h2 className="c4-title">{v4("ckyTitle")}</h2>
        </div>
        <p className="c4-clepsydra-count">{counts.matched}</p>
      </header>
      <ol className="c4-clepsydra-index" aria-label={v4("ckyTitle")}>
        <li data-tone="gold">{v4("ckyBasin")} {counts.basin}</li>
        <li data-tone="ink">{v4("ckyOverdue")} {counts.overdue}</li>
        <li data-tone="ivory">{v4("ckyHouse")} {counts.house}</li>
      </ol>
      <p className="c4-clepsydra-links">
        <Link href={crmv4Href(base, "ptl")}>{v4("ptlTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("ckyCustomers")}</Link>
      </p>
      <p className="c4-clepsydra-hint">{v4("ckyHint")}</p>
      {viewer && <p className="c4-clepsydra-note">{v4("ckyViewer")}</p>}
      {counts.overdue > 0 && <p className="c4-clepsydra-notice" role="status">{v4("ckyOverdue")} {counts.overdue}</p>}
      <ol className="c4-clepsydra-dials" aria-label={v4("ckyChart")}>
        <li>{v4("ckyBasin")} {counts.basin}</li>
        <li>{v4("ckyPeg")} {counts.peg}</li>
        <li>{v4("ckyCasket")} {counts.casket}</li>
        <li>{v4("ckyInner")} {counts.inner}</li>
        <li>{v4("ckyOuter")} {counts.outer}</li>
        <li>{v4("ckyWide")} {counts.wide}</li>
        <li>{v4("ckyStar")} {counts.starred}</li>
        <li>{v4("ckyIdle")} {counts.idle}</li>
        <li>{v4("ckyBrisk")} {counts.brisk}</li>
        <li>{v4("ckyResting")} {counts.resting}</li>
      </ol>
      <div className="c4-clepsydra-chart" aria-label={v4("ckyChart")}>
        {bars.map((bar) => (
          <button key={bar.vessel} type="button" className="c4-clepsydra-column" data-on={vesselFilter === bar.vessel ? "1" : "0"} data-vessel={bar.vessel} onClick={() => setVesselFilter(vesselFilter === bar.vessel ? "all" : bar.vessel)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{vesselLabel(v4, bar.vessel)}</span>
          </button>
        ))}
      </div>
      <div className="c4-clepsydra-tools">
        <input ref={searchRef} className="c4-field c4-clepsydra-search" aria-label={v4("ckySearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("ckySearch")} />
        {(["basin", "peg", "casket"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "basin" ? "ckyBasin" : item === "peg" ? "ckyPeg" : "ckyCasket")}</button>
        ))}
        {(["all", "inner", "outer", ...CKY_VESSELS] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={vesselFilter === item ? "1" : "0"} onClick={() => setVesselFilter(item)}>{item === "all" ? v4("ckyAll") : item === "inner" ? v4("ckyInner") : item === "outer" ? v4("ckyOuter") : vesselLabel(v4, item)}</button>
        ))}
        {(["all", ...INKS] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={inkFilter === item ? "1" : "0"} onClick={() => setInkFilter(item)}>{item === "all" ? v4("ckyAll") : inkLabel(v4, item)}</button>
        ))}
        {(["all", ...DROPS] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={dropFilter === item ? "1" : "0"} onClick={() => setDropFilter(item)}>{item === "all" ? v4("ckyDrop") : item}</button>
        ))}
        {(["all", ...BEATS] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={beatFilter === item ? "1" : "0"} onClick={() => setBeatFilter(item)}>{item === "all" ? v4("ckyBeat") : item}</button>
        ))}
        <button type="button" className="c4-chip" data-on={sort === "vessel" ? "1" : "0"} onClick={() => setSort("vessel")}>{v4("ckySortVessel")}</button>
        <button type="button" className="c4-chip" data-on={sort === "keeper" ? "1" : "0"} onClick={() => setSort("keeper")}>{v4("ckySortKeeper")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "broad" : "tight")}>{density === "tight" ? v4("ckyTight") : v4("ckyBroad")}</button>
        {CKY_VESSELS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={desk === item ? "1" : "0"} onClick={() => setDesk(item)}>{v4("ckyDesk")} {vesselLabel(v4, item)}</button>
        ))}
        {keepers.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={keeperFilter === name ? "1" : "0"} onClick={() => setKeeperFilter(keeperFilter === name ? "" : name)}>{name}</button>
        ))}
      </div>
      <p className="c4-clepsydra-meta">{v4("ckySuggest")} {inkLabel(v4, suggested)} · {dropHint} · {vesselLabel(v4, vesselHint)} · {v4("ckyFair")} {fair || "—"} · {v4("ckyBusy")} {busy || "—"}</p>
      {reminders.length > 0 && (
        <ul className="c4-clepsydra-remind" aria-label={v4("ckyRemind")}>
          {reminders.map((item) => <li key={item}>{item}</li>)}
        </ul>
      )}
      {timeline.length > 0 && (
        <ol className="c4-clepsydra-time" aria-label={v4("ckyTimeline")}>
          {timeline.map((lane) => <li key={lane.drop}>{lane.drop} · {lane.titles.join(" · ")}</li>)}
        </ol>
      )}
      <form className="c4-clepsydra-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addClepsydra(cards, { title, note, keeper, vessel, ink, drop: dropNo, beat: beatNo, tags });
        if (next.length === cards.length) return;
        store(next);
        setTitle("");
        setNote("");
        setTags("");
      }}>
        <input className="c4-field" aria-label={v4("ckyEdit")} aria-required={false} value={title} onChange={(event) => setTitle(event.target.value)} placeholder={v4("ckyEdit")} disabled={viewer} />
        <input className="c4-field" aria-label={v4("ckyNote")} aria-required={false} value={note} onChange={(event) => setNote(event.target.value)} placeholder={v4("ckyNote")} disabled={viewer} />
        <input className="c4-field" aria-label={v4("ckyKeeper")} aria-required={false} value={keeper} onChange={(event) => setKeeper(event.target.value)} placeholder={v4("ckyKeeper")} disabled={viewer} />
        <select className="c4-select" aria-label={v4("ckyDesk")} value={vessel} onChange={(event) => setVessel(event.target.value)} disabled={viewer}>
          <option value="">{v4("ckyBlankVessel")}</option>
          {CKY_VESSELS.map((item) => <option key={item} value={item}>{vesselLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("ckyInk")} value={ink} onChange={(event) => setInk(event.target.value)} disabled={viewer}>
          <option value="">{v4("ckyInk")}</option>
          {INKS.map((item) => <option key={item} value={item}>{inkLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("ckyDrop")} value={dropNo} onChange={(event) => setDropNo(event.target.value)} disabled={viewer}>
          <option value="">{v4("ckyDrop")}</option>
          {DROPS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("ckyBeat")} value={beatNo} onChange={(event) => setBeatNo(event.target.value)} disabled={viewer}>
          <option value="">{v4("ckyBeat")}</option>
          {BEATS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <input className="c4-field" aria-label={v4("ckyTag")} aria-required={false} value={tags} onChange={(event) => setTags(event.target.value)} placeholder={v4("ckyTag")} disabled={viewer} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("ckyAdd")}</button>
      </form>
      <form className="c4-clepsydra-views" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addClepsydraView(views, { id: `v${Date.now().toString(36)}`, name: viewName, tray, query, keeper: keeperFilter, ink: inkFilter, vessel: vesselFilter, drop: dropFilter, beat: beatFilter });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <input className="c4-field" aria-label={v4("ckyViewName")} aria-required={false} value={viewName} onChange={(event) => setViewName(event.target.value)} placeholder={v4("ckyViewName")} disabled={viewer} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("ckySaveView")}</button>
        {views.map((view) => (
          <span key={view.id} className="c4-clepsydra-view">
            <button type="button" className="c4-chip" onClick={() => { setTray(view.tray); setQuery(view.query); setKeeperFilter(view.keeper); setInkFilter(view.ink); setVesselFilter(view.vessel); setDropFilter(view.drop); setBeatFilter(view.beat); }}>{v4("ckyApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropClepsydraView(views, view.id))}>{v4("ckyDropView")}</button>
          </span>
        ))}
      </form>
      <div className="c4-clepsydra-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkClepsydraRun(cards, picked))}>{v4("ckyBulkRun")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkClepsydraGraphite(cards, picked))}>{v4("ckyBulkGraphite")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkClepsydraCasket(cards, picked))}>{v4("ckyBulkCasket")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkClepsydraTag(cards, picked))}>{v4("ckyBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("clepsydra-rules.csv", clepsydraCsv(shown, desk))}>{v4("ckyCsv")}</button>
      </div>
      <p className="c4-clepsydra-keys">{v4("ckyKeys")} j k / p o u d m c a s v x</p>
      {!shown.length && <p className="c4-pay-empty">{v4("ckyEmpty")}</p>}
      <ul className="c4-clepsydra-list" data-density={density}>
        {shown.map((card) => {
          const auditKey = AUDIT_KEY[card.audit];
          return (
            <li key={card.id} className="c4-clepsydra-card" data-on={focused?.id === card.id ? "1" : "0"} data-vessel={card.vessel || "blank"} data-late={lateClepsydra(card, desk) ? "1" : "0"} data-idle={idleClepsydra(card) ? "1" : "0"} data-brisk={briskClepsydra(card) ? "1" : "0"} data-resting={restingClepsydra(card) ? "1" : "0"} data-overdue={overdueClepsydra(card) ? "1" : "0"} data-inner={clepsydraInner(card.vessel) ? "1" : "0"} data-outer={clepsydraOuter(card.vessel) ? "1" : "0"}>
              <label className="c4-clepsydra-pick">
                <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
              </label>
              <div>
                <input className="c4-field" aria-label={v4("ckyEdit")} aria-required={false} defaultValue={card.title} disabled={viewer} onBlur={(event) => store(editClepsydra(cards, card.id, event.target.value))} />
                <input className="c4-field" aria-label={v4("ckyNote")} aria-required={false} defaultValue={card.note} disabled={viewer} onBlur={(event) => store(editClepsydraNote(cards, card.id, event.target.value))} />
                <p className="c4-clepsydra-meta">{card.keeper || "—"} · {vesselLabel(v4, card.vessel)} · {inkLabel(v4, card.ink)} · {card.drop ?? "—"} · {card.beat} · {card.tags.join(" ") || "—"}</p>
                {auditKey && <p className="c4-clepsydra-audit">{v4(auditKey)}</p>}
              </div>
              <div className="c4-clepsydra-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setClepsydraRun(cards, card.id, !card.run))}>{card.run ? v4("ckyClear") : v4("ckyRun")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setClepsydraInk(cards, card.id, suggested))}>{v4("ckySuggest")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setClepsydraPeg(cards, card.id, !card.pegged))}>{card.pegged ? v4("ckyUnpeg") : v4("ckyPegIt")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setClepsydraCasket(cards, card.id, !card.casketed))}>{card.casketed ? v4("ckyUncasket") : v4("ckyCasketIt")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setClepsydraStar(cards, card.id, !card.starred))}>{card.starred ? v4("ckyUnstar") : v4("ckyStar")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addClepsydraTag(cards, card.id, "p"))}>{v4("ckyTag")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(liftDropFocused(cards, card.id))}>{v4("ckyLift")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerDropFocused(cards, card.id))}>{v4("ckyLower")}</button>
                <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(clepsydraCopy(card))}>{v4("ckyCopy")}</button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

type PortolanUser = { id?: string; name?: string | null; referralCodeUsed?: string | null };

export function PortolanPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: PortolanUser[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<PortolanShape>("all");
  const [review, setReview] = useState<PortolanReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): PortolanRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      code: { referral: textField(row.referralCodeUsed) } satisfies PortolanValue,
    };
  }).filter((row): row is PortolanRow => Boolean(row));
  const present = presentPortolanLanes(rows);
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
    const next = readHiddenPortolan(readJson(PTL_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(PTL_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedPortolan(readJson(PTL_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(PTL_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visiblePortolanLanes(present, hidden, showHidden);
  const shown = visiblePortolan(rows, lanes.includes(lane) || lane === "all" ? lane : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = portolanLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = portolanLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingPortolan(rows);
  const leadHue = leadingPortolanHue(rows);
  const whole = rows.filter((row) => portolanLane(row.code)).length;
  const share = portolanShare(lanePortolanCount(rows, "quay"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("portolan-lanes.csv", portolanLanesCsv(rows));
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
    writeJson(PTL_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(PTL_REVIEW_KEY, next);
  }

  return (
    <section className="c4-portolan" aria-label={v4("ptlTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-portolan-mast">
        <p className="c4-portolan-seal" data-logo="mono">{v4("ptlLogo")}</p>
        <div>
          <p className="c4-portolan-kicker">{v4("ptlSub")}</p>
          <h2 className="c4-title">{v4("ptlTitle")}</h2>
        </div>
        <p className="c4-portolan-count">{shown.length}</p>
      </header>
      <p className="c4-portolan-links">
        <Link href={crmv4Href(base, "cky")}>{v4("ckyTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("ptlCustomer")}</Link>
      </p>
      <p className="c4-portolan-hint">{v4("ptlHint")}</p>
      {viewer && <p className="c4-portolan-note">{v4("ptlViewer")}</p>}
      <p className="c4-portolan-meta">{v4("ptlLead")} {laneLabel(v4, lead)} · {v4("ptlToneLead")} {hueLabel(v4, leadHue)} · {v4("ptlShare")} {share}</p>
      <div className="c4-portolan-chart" aria-label={v4("ptlChart")}>
        {lines.map((line) => (
          <button key={line.lane} type="button" className="c4-portolan-column" data-on={lane === line.lane ? "1" : "0"} data-lane={line.lane} onClick={() => setLane(lane === line.lane ? "all" : line.lane)}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-portolan-tools">
        <input ref={searchRef} className="c4-field c4-portolan-search" aria-label={v4("ptlSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("ptlSearch")} />
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("ptlShow")}</button>
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{v4(item === "all" ? "ptlAll" : item === "reviewed" ? "ptlReviewed" : "ptlFresh")}</button>
        ))}
        {(["all", "champagne", "ivory", "graphite"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("ptlAll") : hueLabel(v4, item)}</button>
        ))}
        {(Object.keys(SHAPE_KEY) as PortolanShape[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" onClick={() => storeHidden(togglePortolan(hidden, item))}>{hidden.includes(item) ? v4("ptlShow") : v4("ptlHide")} {laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-portolan-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkPortolanReview(reviewed, picked, true))}>{v4("ptlBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkPortolanReview(reviewed, picked, false))}>{v4("ptlBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("portolan-lanes.csv", portolanLanesCsv(rows))}>{v4("ptlCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("portolan-rows.csv", portolanRowsCsv(shown, reviewed))}>{v4("ptlRowCsv")}</button>
      </div>
      {queue.loading && !rows.length && <p className="c4-meta">{v4("ptlLoading")}</p>}
      {queue.error && <p className="c4-meta">{v4("ptlFailed")}</p>}
      {!queue.loading && !queue.error && !rows.length && <p className="c4-pay-empty">{v4("ptlEmpty")}</p>}
      <ul className="c4-portolan-list">
        {shown.map((row) => {
          const name = portolanCopy(row.code);
          const tone = portolanHue(row.code);
          return (
            <li key={row.id} className="c4-portolan-card" data-lane={portolanLane(row.code) || "open"} data-hue={tone || "none"} data-quay={portolanQuaySafe(row.code)} data-open={portolanOpen(row.code) ? "1" : "0"} data-even={portolanEven(row.code) ? "1" : "0"} data-cipher={portolanCipher(row.code) ? "1" : "0"} data-letter={portolanLetter(row.code) ? "1" : "0"} data-mixed={portolanMixed(row.code) ? "1" : "0"} data-upper={portolanUpper(row.code) ? "1" : "0"} data-lower={portolanLower(row.code) ? "1" : "0"} data-space={portolanSpace(row.code) ? "1" : "0"} data-mouth={portolanMouth(row.code) ? "1" : "0"} data-tail={portolanTail(row.code) ? "1" : "0"} data-first={portolanFirst(row.code) ? "1" : "0"} data-held={portolanHeld(row.code) ? "1" : "0"} data-hyphen={portolanHyphen(row.code) ? "1" : "0"} data-period={portolanPeriod(row.code) ? "1" : "0"} data-capital={portolanCapital(row.code) ? "1" : "0"} data-channel={portolanChannel(row.code) ? "1" : "0"} data-bay={portolanBay(row.code) ? "1" : "0"}>
              <label className="c4-portolan-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-portolan-meta">{name || v4("ptlOpen")} · {portolanStamp(row.code) || "—"} · {portolanFamily(row.code) || "—"} · {portolanLength(row.code) ?? "—"} · {laneLabel(v4, portolanLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-portolan-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(togglePortolanReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("ptlReviewed") : v4("ptlReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const text = portolanCopy(row.code); if (!text) return; navigator.clipboard?.writeText(text); setCopied(row.id); }}>{copied === row.id ? v4("ptlCopied") : v4("ptlCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("ptlCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function portolanQuaySafe(raw: PortolanValue): string {
  return portolanLane(raw) === "quay" ? "1" : "0";
}
