"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  CTC_KEY,
  CTC_REVIEW_KEY,
  LDN_DENSITY_KEY,
  LDN_KEY,
  LDN_VIEW_KEY,
  LODESTONE_BEDS,
  addLodestone,
  addLodestoneTag,
  addLodestoneView,
  briskLodestone,
  bulkContactReview,
  bulkLodestoneGilt,
  bulkLodestoneLog,
  bulkLodestoneStow,
  bulkLodestoneTag,
  busiestBearer,
  contactCold,
  contactCopy,
  contactDeep,
  contactEven,
  contactGap,
  contactHue,
  contactLane,
  contactLanes,
  contactLanesCsv,
  contactLeap,
  contactMark,
  contactQuarter,
  contactQuiet,
  contactRowsCsv,
  contactShare,
  contactSpace,
  contactStamp,
  contactStep,
  contactTail,
  contactToday,
  contactTwin,
  contactWarm,
  cycleStone,
  dropLodestoneView,
  editLodestone,
  editLodestoneNote,
  fairBearer,
  firmBed,
  idleLodestone,
  laneContactCount,
  lateLodestone,
  leadingContact,
  leadingContactHue,
  liftNeedleFocused,
  lockLodestoneFocused,
  lodestoneBars,
  lodestoneBearers,
  lodestoneCopy,
  lodestoneCounts,
  lodestoneCsv,
  lodestoneDensity,
  lodestoneTimeline,
  logLodestoneFocused,
  lowerDipFocused,
  lowerNeedleFocused,
  moveLodestoneFocus,
  overdueLodestone,
  presentContactLanes,
  raiseDipFocused,
  readHiddenContact,
  readLodestoneViews,
  readLodestones,
  readReviewedContact,
  reminderLodestones,
  restingLodestone,
  setLodestoneLock,
  setLodestoneLogged,
  setLodestoneStar,
  setLodestoneStone,
  setLodestoneStow,
  sharedContactCount,
  softBed,
  sortLodestones,
  starLodestoneFocused,
  stoneFocused,
  suggestBed,
  suggestLodestoneStone,
  suggestNeedle,
  tagLodestoneFocused,
  toggleContact,
  toggleContactReview,
  visibleContact,
  visibleContactLanes,
  visibleLodestones,
  type ContactReview,
  type ContactRow,
  type ContactShape,
  type ContactValue,
  type Lodestone,
  type LodestoneDensity,
  type LodestoneSort,
  type LodestoneTray,
  type LodestoneView,
} from "@/lib/crmv4/round288";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

type TouchedRow = { id?: string; name?: string | null; lastContactAt?: string | null };

const STONES = ["IRON", "STEEL", "GILT"] as const;
const NEEDLES = ["2", "4", "6"] as const;
const DIPS = ["1", "3", "5"] as const;
const SHAPES: ContactShape[] = ["all", "warm", "cold", "quiet", "today", "quarter", "even", "leap", "gap", "deep", "twin", "tail", "mark", "space", "week", "month", "season"];

const BED_KEY: Record<string, CrmV4CopyKey> = {
  oak: "ldnOak",
  slate: "ldnSlate",
  sand: "ldnSand",
  moss: "ldnMoss",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "ldnAuditSave",
  edit: "ldnAuditEdit",
  note: "ldnAuditNote",
  stone: "ldnAuditStone",
  log: "ldnAuditLog",
  unlog: "ldnAuditUnlog",
  lock: "ldnAuditLock",
  resume: "ldnAuditResume",
  stow: "ldnAuditStow",
  open: "ldnAuditOpen",
  tag: "ldnAuditTag",
  dip: "ldnAuditDip",
  needle: "ldnAuditNeedle",
  lower: "ldnAuditLower",
  star: "ldnAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  warm: "ctcWarm",
  week: "ctcWeek",
  month: "ctcMonth",
  season: "ctcSeason",
  cold: "ctcCold",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  ivory: "ctcIvory",
  graphite: "ctcGraphite",
  champagne: "ctcChampagne",
};

const SHAPE_KEY: Record<ContactShape, CrmV4CopyKey> = {
  all: "ctcShapeAll",
  warm: "ctcShapeWarm",
  cold: "ctcShapeCold",
  quiet: "ctcShapeQuiet",
  today: "ctcShapeToday",
  quarter: "ctcShapeQuarter",
  even: "ctcShapeEven",
  leap: "ctcShapeLeap",
  gap: "ctcShapeGap",
  deep: "ctcShapeDeep",
  twin: "ctcShapeTwin",
  tail: "ctcShapeTail",
  mark: "ctcShapeMark",
  space: "ctcShapeSpace",
  week: "ctcShapeWeek",
  month: "ctcShapeMonth",
  season: "ctcShapeSeason",
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

function bedLabel(v4: V4, bed: string): string {
  const key = BED_KEY[bed];
  return key ? v4(key) : v4("ldnBlankBed");
}

function stoneLabel(v4: V4, stone: string): string {
  if (stone === "IRON") return v4("ldnIron");
  if (stone === "STEEL") return v4("ldnSteel");
  if (stone === "GILT") return v4("ldnGilt");
  return v4("ldnAll");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("ctcUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("ctcUnmarked");
}

export function LodestoneNeedles({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Lodestone[]>([]);
  const [views, setViews] = useState<LodestoneView[]>([]);
  const [density, setDensity] = useState<LodestoneDensity>("wide");
  const [tray, setTray] = useState<LodestoneTray>("table");
  const [query, setQuery] = useState("");
  const [bearerFilter, setBearerFilter] = useState("");
  const [stoneFilter, setStoneFilter] = useState("all");
  const [bedFilter, setBedFilter] = useState("all");
  const [needleFilter, setNeedleFilter] = useState("all");
  const [dipFilter, setDipFilter] = useState("all");
  const [sort, setSort] = useState<LodestoneSort>("bed");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [bearer, setBearer] = useState("");
  const [bed, setBed] = useState("");
  const [stone, setStone] = useState("");
  const [needleNo, setNeedleNo] = useState("");
  const [dipNo, setDipNo] = useState("");
  const [tags, setTags] = useState("");
  const [viewName, setViewName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focusAt, setFocusAt] = useState(0);
  const [desk, setDesk] = useState("oak");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readLodestones(readJson(LDN_KEY, [])));
    setViews(readLodestoneViews(readJson(LDN_VIEW_KEY, [])));
    setDensity(lodestoneDensity(readJson(LDN_DENSITY_KEY, "wide")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Lodestone[]) {
    setCards(next);
    writeJson(LDN_KEY, next);
  }
  function storeViews(next: LodestoneView[]) {
    setViews(next);
    writeJson(LDN_VIEW_KEY, next);
  }
  function storeDensity(next: LodestoneDensity) {
    setDensity(next);
    writeJson(LDN_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortLodestones(visibleLodestones(cards, tray, query, bearerFilter, stoneFilter, bedFilter, needleFilter, dipFilter), sort),
    [cards, tray, query, bearerFilter, stoneFilter, bedFilter, needleFilter, dipFilter, sort],
  );
  const counts = lodestoneCounts(cards, shown, desk);
  const bars = lodestoneBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = lodestoneTimeline(cards);
  const bearers = lodestoneBearers(cards);
  const ids = shown.map((card) => card.id);
  const suggested = suggestLodestoneStone(cards);
  const fair = fairBearer(cards, bearers.join(","));
  const busy = busiestBearer(cards);
  const reminders = reminderLodestones(cards);
  const needleHint = suggestNeedle(cards, clock);
  const bedHint = suggestBed(clock);
  const focused = shown[focusAt];

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setTitle("");
        setNote("");
        setBearer("");
        setBed("");
        setStone("");
        setNeedleNo("");
        setDipNo("");
        setTags("");
        return;
      }
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocusAt((index) => moveLodestoneFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocusAt((index) => moveLodestoneFocus(index, shown.length, -1));
        return;
      }
      if (viewer) return;
      const id = shown[focusAt]?.id || "";
      if (event.key === "q" || event.key === "Q") {
        event.preventDefault();
        store(liftNeedleFocused(cards, id));
        return;
      }
      if (event.key === "v" || event.key === "V") {
        event.preventDefault();
        store(setLodestoneStow(cards, id, !shown[focusAt]?.stowed));
        return;
      }
      if (event.key === "g" || event.key === "G") {
        event.preventDefault();
        store(stoneFocused(cards, id));
        return;
      }
      if (event.key === "l" || event.key === "L") {
        event.preventDefault();
        store(lockLodestoneFocused(cards, id));
        return;
      }
      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        store(logLodestoneFocused(cards, id));
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("lodestone-needles.csv", lodestoneCsv(shown, desk));
        return;
      }
      if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        store(starLodestoneFocused(cards, id));
        return;
      }
      if (event.key === "u" || event.key === "U") {
        event.preventDefault();
        store(raiseDipFocused(cards, id));
        return;
      }
      if (event.key === "y" || event.key === "Y") {
        event.preventDefault();
        store(lowerDipFocused(cards, id));
        return;
      }
      if (event.key === "f" || event.key === "F") {
        event.preventDefault();
        store(lowerNeedleFocused(cards, id));
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
    <section className="c4-lodestone" aria-label={v4("ldnTitle")} data-cards="1" data-desk={tray} data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-lodestone-mast">
        <p className="c4-lodestone-seal" data-logo="mono">{v4("ldnLogo")}</p>
        <div>
          <p className="c4-lodestone-kicker">{v4("ldnSub")}</p>
          <h2 className="c4-title">{v4("ldnTitle")}</h2>
        </div>
        <ol className="c4-lodestone-index" aria-label={v4("ldnTitle")}>
          <li data-tone="gold">{v4("ldnGilt")}</li>
          <li data-tone="ink">{v4("ldnSteel")}</li>
          <li data-tone="ivory">{v4("ldnIron")}</li>
        </ol>
      </header>
      <p className="c4-lodestone-links">
        <Link href={crmv4Href(base, "ctc")}>{v4("ctcTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("ldnCustomers")}</Link>
        <Link href={crmv4Href(base, "riskwatch")}>{v4("rwSlateKicker")}</Link>
      </p>
      <p className="c4-lodestone-hint">{v4("ldnHint")}</p>
      {viewer && <p className="c4-lodestone-note">{v4("ldnViewer")}</p>}
      {counts.overdue > 0 && <p className="c4-lodestone-notice" role="status">{v4("ldnOverdue")} {counts.overdue}</p>}
      <ol className="c4-lodestone-dials" aria-label={v4("ldnChart")}>
        <li><span>{v4("ldnTable")}</span><strong>{counts.table}</strong></li>
        <li><span>{v4("ldnCabinet")}</span><strong>{counts.cabinet}</strong></li>
        <li><span>{v4("ldnCellar")}</span><strong>{counts.cellar}</strong></li>
        <li><span>{v4("ldnOverdue")}</span><strong>{counts.overdue}</strong></li>
        <li><span>{v4("ldnIdle")}</span><strong>{counts.idle}</strong></li>
        <li><span>{v4("ldnBrisk")}</span><strong>{counts.brisk}</strong></li>
        <li><span>{v4("ldnFair")}</span><strong>{fair || "·"}</strong></li>
        <li><span>{v4("ldnBusy")}</span><strong>{busy || "·"}</strong></li>
      </ol>
      <div className="c4-lodestone-chart" aria-label={v4("ldnChart")}>
        {bars.map((bar) => (
          <button key={bar.bed} type="button" className="c4-lodestone-column" data-on={bedFilter === bar.bed ? "1" : "0"} data-bed={bar.bed} onClick={() => setBedFilter(bedFilter === bar.bed ? "all" : bar.bed)}>
            <i style={{ height: `${Math.max(8, Math.round((bar.count / peak) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{bedLabel(v4, bar.bed)}</span>
          </button>
        ))}
      </div>
      <div className="c4-lodestone-tools">
        <input ref={searchRef} className="c4-field c4-lodestone-search" aria-label={v4("ldnSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("ldnSearch")} />
        {(["table", "cabinet", "cellar"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "table" ? "ldnTable" : item === "cabinet" ? "ldnCabinet" : "ldnCellar")}</button>
        ))}
        {(["all", "firm", "soft", ...LODESTONE_BEDS] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={bedFilter === item ? "1" : "0"} onClick={() => setBedFilter(item)}>{item === "all" ? v4("ldnAll") : item === "firm" ? v4("ldnFirm") : item === "soft" ? v4("ldnSoft") : bedLabel(v4, item)}</button>
        ))}
        {["all", ...STONES].map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={stoneFilter === item ? "1" : "0"} onClick={() => setStoneFilter(item)}>{item === "all" ? v4("ldnStone") : stoneLabel(v4, item)}</button>
        ))}
        {["all", ...NEEDLES].map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={needleFilter === item ? "1" : "0"} onClick={() => setNeedleFilter(item)}>{item === "all" ? v4("ldnNeedle") : item}</button>
        ))}
        {["all", ...DIPS].map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={dipFilter === item ? "1" : "0"} onClick={() => setDipFilter(item)}>{item === "all" ? v4("ldnDip") : item}</button>
        ))}
        <button type="button" className="c4-chip" data-on={sort === "bearer" ? "1" : "0"} onClick={() => setSort(sort === "bed" ? "bearer" : "bed")}>{sort === "bed" ? v4("ldnSortBed") : v4("ldnSortBearer")}</button>
        <button type="button" className="c4-chip" data-on={density === "narrow" ? "1" : "0"} onClick={() => storeDensity(density === "wide" ? "narrow" : "wide")}>{density === "wide" ? v4("ldnWide") : v4("ldnNarrow")}</button>
        <button type="button" className="c4-btn" onClick={() => download("lodestone-needles.csv", lodestoneCsv(shown, desk))}>{v4("ldnCsv")}</button>
      </div>
      <div className="c4-lodestone-tools" role="group" aria-label={v4("ldnDesk")}>
        {LODESTONE_BEDS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={desk === item ? "1" : "0"} onClick={() => setDesk(item)}>{v4("ldnDesk")} {bedLabel(v4, item)}</button>
        ))}
        <span className="c4-lodestone-meta">{v4("ldnSuggest")} {stoneLabel(v4, suggested)} · {needleHint} · {bedLabel(v4, bedHint)}</span>
      </div>
      <form className="c4-lodestone-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addLodestone(cards, { title, note, bearer, bed, stone: stone || suggested, needle: needleNo, dip: dipNo, tags });
        if (next.length === cards.length) return;
        store(next);
        setTitle("");
        setNote("");
        setTags("");
      }}>
        <input className="c4-field" aria-label={v4("ldnEdit")} aria-required={false} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} placeholder={v4("ldnTitle")} />
        <input className="c4-field" aria-label={v4("ldnNote")} aria-required={false} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} placeholder={v4("ldnNote")} />
        <input className="c4-field" aria-label={v4("ldnBearer")} aria-required={false} value={bearer} disabled={viewer} onChange={(event) => setBearer(event.target.value)} placeholder={v4("ldnBearer")} />
        <select className="c4-select" aria-label={v4("ldnBed")} value={bed} disabled={viewer} onChange={(event) => setBed(event.target.value)}>
          <option value="">{v4("ldnBlankBed")}</option>
          {LODESTONE_BEDS.map((item) => <option key={item} value={item}>{bedLabel(v4, item)}</option>)}
        </select>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("ldnAdd")}</button>
      </form>
      <form className="c4-lodestone-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addLodestoneView(views, { id: `v${Date.now().toString(36)}`, name: viewName, tray, query, bearer: bearerFilter, stone: stoneFilter, bed: bedFilter, needle: needleFilter, dip: dipFilter });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <input className="c4-field" aria-label={v4("ldnViewName")} aria-required={false} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} placeholder={v4("ldnViewName")} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("ldnSaveView")}</button>
      </form>
      <ul className="c4-lodestone-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setBearerFilter(view.bearer); setStoneFilter(view.stone); setBedFilter(view.bed); setNeedleFilter(view.needle); setDipFilter(view.dip); }}>{v4("ldnApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropLodestoneView(views, view.id))}>{v4("ldnDrop")}</button>
          </li>
        ))}
      </ul>
      {picked.length > 0 && (
        <div className="c4-lodestone-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkLodestoneGilt(cards, picked))}>{v4("ldnBulkGilt")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkLodestoneLog(cards, picked))}>{v4("ldnBulkLog")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkLodestoneStow(cards, picked))}>{v4("ldnBulkStow")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkLodestoneTag(cards, picked))}>{v4("ldnBulkTag")}</button>
        </div>
      )}
      <p className="c4-lodestone-meta">{v4("ldnKeys")} · j k n l g v s f q u y x /</p>
      {timeline.length > 0 && (
        <ol className="c4-lodestone-time" aria-label={v4("ldnTimeline")}>
          {timeline.map((lane) => (
            <li key={lane.needle}><span>{v4("ldnNeedle")} {lane.needle}</span><strong>{lane.titles.join(" · ")}</strong></li>
          ))}
        </ol>
      )}
      {reminders.length > 0 && <p className="c4-lodestone-meta">{v4("ldnRemind")} {reminders.join(" · ")}</p>}
      {!shown.length && <p className="c4-lodestone-empty">{v4("ldnEmpty")}</p>}
      <ol className="c4-lodestone-board">
        {shown.map((card, index) => {
          const on = index === focusAt;
          return (
            <li key={card.id} className="c4-lodestone-card" data-on={on ? "1" : "0"} data-overdue={overdueLodestone(card) ? "1" : "0"} data-idle={idleLodestone(card) ? "1" : "0"} data-brisk={briskLodestone(card) ? "1" : "0"} data-resting={restingLodestone(card) ? "1" : "0"} data-late={lateLodestone(card, desk) ? "1" : "0"} data-soft={softBed(card.bed) ? "1" : "0"} data-firm={firmBed(card.bed) ? "1" : "0"} data-star={card.flagged ? "1" : "0"}>
              <label className="c4-lodestone-pick"><input type="checkbox" checked={picked.includes(card.id)} aria-label={card.title} onChange={() => setPicked((current) => (current.includes(card.id) ? current.filter((item) => item !== card.id) : [...current, card.id]))} /></label>
              <div>
                {on && !viewer ? (
                  <input className="c4-field" aria-label={v4("ldnEdit")} aria-required={false} value={card.title} onChange={(event) => store(editLodestone(cards, card.id, event.target.value))} />
                ) : (
                  <strong>{card.title}</strong>
                )}
                <p className="c4-lodestone-meta">{card.bearer || v4("ldnBearer")} · {bedLabel(v4, card.bed)} · {stoneLabel(v4, card.stone)} · {card.needle ?? "·"} · {v4("ldnDip")} {card.dip}{card.tags.length ? ` · ${card.tags.join("")}` : ""}{card.audit ? ` · ${AUDIT_KEY[card.audit] ? v4(AUDIT_KEY[card.audit]) : card.audit}` : ""}</p>
                {on && !viewer ? (
                  <input className="c4-field" aria-label={v4("ldnNote")} aria-required={false} value={card.note} onChange={(event) => store(editLodestoneNote(cards, card.id, event.target.value))} />
                ) : (
                  card.note && <p className="c4-lodestone-meta">{card.note}</p>
                )}
                <div className="c4-lodestone-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setLodestoneLogged(cards, card.id, !card.logged))}>{card.logged ? v4("ldnUnlog") : v4("ldnLog")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setLodestoneLock(cards, card.id, !card.locked))}>{card.locked ? v4("ldnUnlock") : v4("ldnLock")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setLodestoneStow(cards, card.id, !card.stowed))}>{card.stowed ? v4("ldnUnstow") : v4("ldnStow")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setLodestoneStar(cards, card.id, !card.flagged))}>{card.flagged ? v4("ldnUnstar") : v4("ldnStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setLodestoneStone(cards, card.id, cycleStone(card.stone)))}>{v4("ldnStone")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(liftNeedleFocused(cards, card.id))}>{v4("ldnLift")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerNeedleFocused(cards, card.id))}>{v4("ldnLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseDipFocused(cards, card.id))}>{v4("ldnDip")}+</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerDipFocused(cards, card.id))}>{v4("ldnDip")}−</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addLodestoneTag(cards, card.id, "p"))}>{v4("ldnTag")} p</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(tagLodestoneFocused(cards, card.id))}>{v4("ldnTag")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(lodestoneCopy(card)); }}>{v4("ctcCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="c4-lodestone-meta">{v4("ldnMatched")} {counts.matched} · {ids.length}</p>
    </section>
  );
}

export function RecallPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: TouchedRow[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<ContactShape>("all");
  const [review, setReview] = useState<ContactReview>("all");
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

  const rows = useMemo<ContactRow[]>(() => {
    return (queue.data?.users || []).map((row, index) => ({
      id: textField(row.id) || `c${index}`,
      label: textField(row.name),
      touched: { lastContactAt: textField(row.lastContactAt) } satisfies ContactValue,
    }));
  }, [queue.data]);

  useEffect(() => {
    const ids = rows.map((row) => row.id);
    const clock = Date.now();
    setHidden(readHiddenContact(readJson(CTC_KEY, []), presentContactLanes(rows, clock)));
    setReviewed(readReviewedContact(readJson(CTC_REVIEW_KEY, []), ids));
  }, [rows]);

  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(CTC_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(CTC_REVIEW_KEY, next);
  }

  const lanes = visibleContactLanes(presentContactLanes(rows, now), hidden, showHidden);
  const shown = visibleContact(rows, lane, hue, query, review, reviewed, shape, now).filter((row) => !hidden.includes(contactLane(row.touched, now)) || showHidden);
  const bars = contactLanes(rows, now);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const lead = leadingContact(rows, now);
  const leadHue = leadingContactHue(rows, now);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocusAt((index) => moveLodestoneFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocusAt((index) => moveLodestoneFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "m" || event.key === "M") {
        event.preventDefault();
        if (viewer) return;
        const id = shown[focusAt]?.id;
        if (id) storeReviewed(toggleContactReview(reviewed, id));
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
    <section className="c4-contact" aria-label={v4("ctcTitle")} data-plates="1" data-names={rows.length} data-role={role}>
      <header className="c4-contact-mast">
        <p className="c4-contact-seal" data-logo="mono">{v4("ctcLogo")}</p>
        <div>
          <p className="c4-contact-kicker">{v4("ctcSub")}</p>
          <h2 className="c4-title">{v4("ctcTitle")}</h2>
        </div>
      </header>
      <ol className="c4-contact-index" aria-label={v4("ctcTitle")}>
        <li data-tone="gold">{v4("ctcWarm")}</li>
        <li data-tone="ink">{v4("ctcCold")}</li>
        <li data-tone="ivory">{v4("ctcWeek")}</li>
        <li data-tone="mist">{v4("ctcMonth")}</li>
        <li data-tone="line">{v4("ctcSeason")}</li>
      </ol>
      <p className="c4-contact-links">
        <Link href={crmv4Href(base, "ldn")}>{v4("ldnTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("ldnCustomers")}</Link>
        <Link href={crmv4Href(base, "maildense")}>{v4("mdVellumKicker")}</Link>
      </p>
      <p className="c4-contact-hint">{v4("ctcHint")}</p>
      {viewer && <p className="c4-contact-note">{v4("ctcViewer")}</p>}
      {queue.loading && <p className="c4-contact-meta">{v4("ctcEmpty")}</p>}
      {queue.error && <p className="c4-contact-meta">{queue.error}</p>}
      <ul className="c4-contact-kpis" aria-label={v4("ctcRules")}>
        <li><span>{v4("ctcLead")}</span><strong>{lead ? laneLabel(v4, lead) : v4("ctcUnmarked")}</strong></li>
        <li><span>{v4("ctcToneLead")}</span><strong>{leadHue ? hueLabel(v4, leadHue) : v4("ctcUnmarked")}</strong></li>
        <li><span>{v4("ctcWarm")}</span><strong>{laneContactCount(rows, "warm", now)}</strong></li>
        <li><span>{v4("ctcCold")}</span><strong>{laneContactCount(rows, "cold", now)}</strong></li>
        <li><span>{v4("ctcShare")}</span><strong>{contactShare(laneContactCount(rows, "cold", now), Math.max(1, rows.length))}%</strong></li>
        <li><span>{v4("ctcQuiet")}</span><strong>{rows.filter((row) => contactQuiet(row.touched)).length}</strong></li>
        <li><span>{v4("ctcToday")}</span><strong>{rows.filter((row) => contactToday(row.touched, now)).length}</strong></li>
        <li><span>{v4("ctcTwin")}</span><strong>{sharedContactCount(rows, now)}</strong></li>
      </ul>
      <div className="c4-contact-chart" aria-label={v4("ctcRules")}>
        {bars.map((bar) => (
          <button key={bar.lane} type="button" className="c4-contact-column" data-on={lane === bar.lane ? "1" : "0"} data-lane={bar.lane} onClick={() => setLane(lane === bar.lane ? "all" : bar.lane)}>
            <i style={{ height: `${Math.max(12, Math.round((bar.count / maxBar) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{laneLabel(v4, bar.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-contact-tools">
        <input ref={searchRef} className="c4-field c4-contact-search" aria-label={v4("ctcSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("ctcSearch")} />
        {(["all", "ivory", "graphite", "champagne"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("ctcAll") : hueLabel(v4, item)}</button>
        ))}
        {SHAPES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{item === "all" ? v4("ctcAll") : item === "reviewed" ? v4("ctcReviewed") : v4("ctcFreshCut")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("ctcShow")}</button>
        <button type="button" className="c4-btn" onClick={() => download("contact-lanes.csv", contactLanesCsv(rows, now))}>{v4("ctcCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("contact-rows.csv", contactRowsCsv(rows, reviewed, now))}>{v4("ctcRowCsv")}</button>
      </div>
      <ul className="c4-contact-lanes">
        {lanes.map((item) => (
          <li key={item}>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(toggleContact(hidden, item))}>{hidden.includes(item) ? v4("ctcShow") : v4("ctcHide")} {laneLabel(v4, item)}</button>
          </li>
        ))}
      </ul>
      {picked.length > 0 && (
        <div className="c4-contact-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkContactReview(reviewed, picked, true))}>{v4("ctcBulkReview")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkContactReview(reviewed, picked, false))}>{v4("ctcBulkClear")}</button>
        </div>
      )}
      {!shown.length && <p className="c4-contact-empty">{v4("ctcEmpty")}</p>}
      <ol className="c4-contact-board">
        {shown.map((row, index) => {
          const seen = reviewed.includes(row.id);
          return (
            <li key={row.id} className="c4-contact-card" data-on={index === focusAt ? "1" : "0"} data-lane={contactLane(row.touched, now)} data-hue={contactHue(row.touched, now)} data-reviewed={seen ? "1" : "0"} data-warm={contactWarm(row.touched, now) ? "1" : "0"} data-cold={contactCold(row.touched, now) ? "1" : "0"} data-today={contactToday(row.touched, now) ? "1" : "0"} data-quarter={contactQuarter(row.touched, now) ? "1" : "0"}>
              <p className="c4-contact-stamp">{contactStamp(row.touched, now) || "·"}</p>
              <label className="c4-contact-pick"><input type="checkbox" checked={picked.includes(row.id)} aria-label={row.label || row.id} onChange={() => setPicked((current) => (current.includes(row.id) ? current.filter((item) => item !== row.id) : [...current, row.id]))} /></label>
              <div>
                <strong>{row.label || v4("ctcUnmarked")}</strong>
                <p className="c4-contact-meta">{laneLabel(v4, contactLane(row.touched, now))} · {hueLabel(v4, contactHue(row.touched, now))} · {v4("ctcStep")} {contactStep(row.touched, now)}{contactEven(row.touched, now) ? ` · ${v4("ctcEven")}` : ""}{contactLeap(row.touched, now) ? ` · ${v4("ctcLeap")}` : ""}{contactGap(row.touched, now) ? ` · ${v4("ctcGap")}` : ""}{contactDeep(row.touched, now) ? ` · ${v4("ctcDeep")}` : ""}{contactTwin(row.touched, now) ? ` · ${v4("ctcTwin")}` : ""}{contactTail(row.touched) ? ` · ${v4("ctcTail")}` : ""}{contactMark(row.touched) ? ` · ${v4("ctcMark")}` : ""}{contactSpace(row.touched) ? ` · ${v4("ctcSpace")}` : ""}{contactQuiet(row.touched) ? ` · ${v4("ctcQuiet")}` : ""}{contactQuarter(row.touched, now) ? ` · ${v4("ctcQuarter")}` : ""}</p>
                <div className="c4-contact-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleContactReview(reviewed, row.id))}>{seen ? v4("ctcReviewed") : v4("ctcReview")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(contactCopy(row.touched)); setCopied(row.id); }}>{copied === row.id ? v4("ctcCopied") : v4("ctcCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
