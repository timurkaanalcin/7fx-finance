"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  ANEMO_BEARINGS,
  ANM_DENSITY_KEY,
  ANM_KEY,
  ANM_VIEW_KEY,
  RTN_KEY,
  RTN_REVIEW_KEY,
  addCup,
  addCupTag,
  addCupView,
  briskCup,
  bulkCupChampagne,
  bulkCupEast,
  bulkCupPin,
  bulkCupStow,
  bulkCupTag,
  bulkRetentionReview,
  busiestKeeper,
  cupBars,
  cupCopy,
  cupCounts,
  cupCsv,
  cupDensity,
  cupKeepers,
  cupTimeline,
  clashBearingCount,
  cycleVane,
  dropCupView,
  editCup,
  editCupNote,
  fairKeeper,
  houseLacquer,
  idleCup,
  idleCups,
  laneRetentionCount,
  lateCup,
  leadingRetention,
  leadingRetentionHue,
  lengthenWatch,
  lengthenWatchFocused,
  lowerBead,
  lowerBeadFocused,
  moveAnemoFocus,
  neighborBeadCount,
  overdueCup,
  stayCupFocused,
  pinCupFocused,
  vaneFocused,
  presentRetentionLanes,
  keenBearing,
  raiseBead,
  raiseBeadFocused,
  readCups,
  readCupViews,
  readHiddenRetentions,
  readReviewedRetentions,
  reminderCups,
  restingCup,
  setCupLacquer,
  setCupStay,
  setCupPin,
  setCupStow,
  setCupStar,
  sharedRetentionCount,
  shortenWatch,
  shortenWatchFocused,
  sortCups,
  retentionCopy,
  retentionEcho,
  retentionHue,
  retentionKnown,
  retentionCap,
  retentionLane,
  retentionLanes,
  retentionLanesCsv,
  retentionLeap,
  retentionNotch,
  retentionRowsCsv,
  retentionShare,
  retentionSlash,
  retentionStamp,
  retentionStep,
  retentionTail,
  retentionTwin,
  retentionWide,
  starCupFocused,
  stillBearing,
  suggestWatch,
  suggestBearing,
  suggestLacquer,
  tagCupFocused,
  toggleRetention,
  toggleRetentionReview,
  visibleCups,
  visibleRetentionLanes,
  visibleRetentions,
  type CupDensity,
  type AnemoCup,
  type CupSort,
  type CupTray,
  type CupView,
  type RetentionReview,
  type RetentionRow,
  type RetentionShape,
  type RetentionValue,
} from "@/lib/crmv4/round271";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const METALS = ["ivory", "graphite", "champagne"] as const;
const VANES = ["north", "east", "south"] as const;
const WATCHES = ["15", "30", "60"] as const;
const BEADS = ["2", "4", "6", "8"] as const;

const BEARING_KEY: Record<string, CrmV4CopyKey> = {
  calm: "anmCalm",
  breeze: "anmBreeze",
  gale: "anmGale",
  storm: "anmStorm",
  keen: "anmKeenBearing",
  still: "anmStillBearing",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "anmAuditSave",
  edit: "anmAuditEdit",
  note: "anmAuditNote",
  vane: "anmAuditVane",
  pin: "anmAuditPin",
  unpin: "anmAuditUnpin",
  pause: "anmAuditPause",
  resume: "anmAuditResume",
  seal: "anmAuditSeal",
  open: "anmAuditOpen",
  lacquer: "anmAuditLacquer",
  tag: "anmAuditTag",
  bead: "anmAuditBead",
  watch: "anmAuditWatch",
  short: "anmAuditShort",
  flag: "anmAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  grove: "rtnGrove",
  court: "rtnCourt",
  shade: "rtnShade",
  verge: "rtnVerge",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  ivory: "rtnIvory",
  graphite: "rtnGraphite",
  champagne: "rtnChampagne",
};

type NameRow = {
  id?: string;
  name?: string | null;
  retentionStatus?: string | null;
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

function bearingLabel(v4: V4, bearing: string): string {
  const key = BEARING_KEY[bearing];
  return key ? v4(key) : v4("anmBlank");
}

function lacquerLabel(v4: V4, lacquer: string): string {
  if (lacquer === "IVORY") return v4("anmFlax");
  if (lacquer === "GRAPHITE") return v4("anmWool");
  if (lacquer === "CHAMPAGNE") return v4("anmSilk");
  return v4("anmBlankLacquer");
}

function vaneLabel(v4: V4, vane: string): string {
  if (vane === "north") return v4("anmNorth");
  if (vane === "east") return v4("anmEast");
  if (vane === "south") return v4("anmSouth");
  return v4("anmBlankVane");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("rtnUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("rtnUnmarked");
}

export function AnemometerCups({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<AnemoCup[]>([]);
  const [views, setViews] = useState<CupView[]>([]);
  const [density, setDensity] = useState<CupDensity>("roomy");
  const [sort, setSort] = useState<CupSort>("bearing");
  const [tray, setTray] = useState<CupTray>("open");
  const [query, setQuery] = useState("");
  const [keeperFilter, setKeeperFilter] = useState("all");
  const [lacquerFilter, setLacquerFilter] = useState("all");
  const [vaneFilter, setVaneFilter] = useState("all");
  const [bearingFilter, setBearingFilter] = useState("all");
  const [watchFilter, setWatchFilter] = useState("all");
  const [beadFilter, setBeadFilter] = useState("all");
  const [houseOnly, setHouseOnly] = useState(false);
  const [keenOnly, setKeenOnly] = useState(false);
  const [stillOnly, setStillOnly] = useState(false);
  const [desk, setDesk] = useState("gale");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [keeper, setKeeper] = useState("");
  const [bearing, setBearing] = useState("");
  const [lacquer, setLacquer] = useState("");
  const [vane, setVane] = useState("");
  const [watchMin, setWatchMin] = useState("");
  const [bead, setBead] = useState("2");
  const [tags, setTags] = useState("");
  const [viewName, setViewName] = useState("");
  const [sheet, setSheet] = useState<"rose" | "index">("rose");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [copied, setCopied] = useState("");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  useEffect(() => {
    setCards(readCups(readJson(ANM_KEY, [])));
    setViews(readCupViews(readJson(ANM_VIEW_KEY, [])));
    setDensity(cupDensity(readJson(ANM_DENSITY_KEY, "roomy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  const shown = sortCups(visibleCups(cards, tray, query, keeperFilter, lacquerFilter, vaneFilter, bearingFilter, watchFilter, beadFilter, houseOnly, keenOnly, stillOnly), sort);
  const focusAt = shown.length ? focus % shown.length : 0;
  const counts = cupCounts(cards, shown, desk);
  const timeline = cupTimeline(cards);
  const reminders = reminderCups(cards);
  const idling = idleCups(cards);
  const keepers = cupKeepers(cards);
  const bars = cupBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const ids = shown.map((card) => card.id);
  const busy = busiestKeeper(cards);
  const clock = new Date().getUTCHours();
  const suggested = suggestLacquer(cards);
  const fair = fairKeeper(cards, keepers.join(", ") || "Nia, Sol");
  const bearingHint = suggestBearing(clock);
  function store(next: AnemoCup[]) {
    const saved = readCups(next);
    setCards(saved);
    writeJson(ANM_KEY, saved);
  }
  function storeViews(next: CupView[]) {
    const saved = readCupViews(next);
    setViews(saved);
    writeJson(ANM_VIEW_KEY, saved);
  }
  function storeDensity(next: CupDensity) {
    setDensity(next);
    writeJson(ANM_DENSITY_KEY, next);
  }
  function togglePick(id: string) {
    setPicked((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }
  function applyView(view: CupView) {
    setTray(view.tray);
    setQuery(view.query);
    setKeeperFilter(view.keeper || "all");
    setLacquerFilter(view.lacquer);
    setVaneFilter(view.vane);
    setBearingFilter(view.bearing);
    setWatchFilter(view.watch);
    setBeadFilter(view.bead);
  }
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setTitle("");
        setNote("");
        setKeeper("");
        setBearing("");
        setLacquer("");
        setVane("");
        setWatchMin("");
        setTags("");
        return;
      }
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveAnemoFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveAnemoFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "h" || event.key === "H") {
        event.preventDefault();
        if (!viewer) store(stayCupFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        if (!viewer) store(pinCupFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "g" || event.key === "G") {
        event.preventDefault();
        if (!viewer) store(vaneFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "l" || event.key === "L") {
        event.preventDefault();
        if (!viewer) store(lengthenWatchFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        if (!viewer) store(shortenWatchFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        if (!viewer) store(tagCupFocused(cards, ids, focusAt, "a"));
        return;
      }
      if (event.key === "w" || event.key === "W") {
        event.preventDefault();
        if (!viewer) store(starCupFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "u" || event.key === "U") {
        event.preventDefault();
        if (!viewer) store(raiseBeadFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "y" || event.key === "Y") {
        event.preventDefault();
        if (!viewer) store(lowerBeadFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "b" || event.key === "B") {
        event.preventDefault();
        setSheet((value) => value === "rose" ? "index" : "rose");
        return;
      }
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shown.length, viewer, cards, ids, focusAt]);
  return (
    <section className="c4-anemo" aria-label={v4("anmTitle")} data-cards="1" data-desk="anemo" data-role={role} data-density={density} data-sheet={sheet}>
      <header className="c4-anemo-mast">
        <p className="c4-anemo-seal" data-logo="mono" aria-hidden="true">
          <span>{v4("anmLogo")}</span>
          <i />
        </p>
        <div className="c4-anemo-mast-copy">
          <p className="c4-anemo-kicker">{v4("anmSub")}</p>
          <h2 className="c4-title">{v4("anmTitle")}</h2>
        </div>
        <ol className="c4-anemo-rose" aria-hidden="true">
          <li>{v4("anmNorth")}</li>
          <li>{v4("anmEast")}</li>
          <li>{v4("anmSouth")}</li>
        </ol>
      </header>
      <p className="c4-anemo-links">
        <Link href={crmv4Href(base, "rtn")}>{v4("anmPlates")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("anmCustomers")}</Link>
        <Link href={crmv4Href(base, "support")}>{v4("anmSupport")}</Link>
      </p>
      {viewer && <p className="c4-anemo-note">{v4("anmViewer")}</p>}
      <p className="c4-anemo-lead">{v4("anmKeys")}</p>
      <p className="c4-anemo-hint">{v4("anmHint")}</p>
      <p className="c4-anemo-notice" role="status">{v4("anmNotice")} {counts.overdue}</p>
      <ol className="c4-anemo-ledger" aria-label={v4("anmChart")}>
        <li><span>{v4("anmOpen")}</span><strong>{counts.open}</strong></li>
        <li><span>{v4("anmPause")}</span><strong>{counts.pause}</strong></li>
        <li><span>{v4("anmSealed")}</span><strong>{counts.seal}</strong></li>
        <li><span>{v4("anmPinned")}</span><strong>{counts.pinned}</strong></li>
        <li><span>{v4("anmKeen")}</span><strong>{counts.keen}</strong></li>
        <li><span>{v4("anmStill")}</span><strong>{counts.still}</strong></li>
        <li><span>{v4("anmSoon")}</span><strong>{counts.soon}</strong></li>
        <li><span>{v4("anmOverdue")}</span><strong>{counts.overdue}</strong></li>
      </ol>
      <ol className="c4-anemo-columns" aria-label={v4("anmBars")}>
        {bars.map((bar) => (
          <li key={bar.bearing} data-bearing={bar.bearing}>
            <strong>{bar.count}</strong>
            <i style={{ height: `${Math.max(6, Math.round((bar.count / peak) * 96))}px` }} />
            <span>{bearingLabel(v4, bar.bearing)}</span>
          </li>
        ))}
      </ol>
      <ol className="c4-anemo-time" aria-label={v4("anmTimeline")}>
        {timeline.map((lane) => (
          <li key={lane.bead}><span>{lane.bead}</span><strong>{lane.titles.join(" · ")}</strong></li>
        ))}
      </ol>
      <div className="c4-anemo-tools">
        <label className="c4-lab">
          <span>{v4("anmDesk")}</span>
          <select className="c4-select" aria-label={v4("anmDesk")} value={desk} onChange={(event) => setDesk(event.target.value)}>
            {ANEMO_BEARINGS.map((item) => <option key={item} value={item}>{bearingLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("anmSearch")}</span>
          <input ref={searchRef} className="c4-field c4-anemo-search" aria-label={v4("anmSearch")} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("anmSearch")} />
        </label>
        {(["open", "pause", "seal"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{item === "open" ? v4("anmOpen") : item === "pause" ? v4("anmPause") : v4("anmSealed")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((value) => !value)}>{v4("anmHouseOnly")}</button>
        <button type="button" className="c4-chip" data-on={keenOnly ? "1" : "0"} onClick={() => setKeenOnly((value) => !value)}>{v4("anmKeen")}</button>
        <button type="button" className="c4-chip" data-on={stillOnly ? "1" : "0"} onClick={() => setStillOnly((value) => !value)}>{v4("anmStill")}</button>
        <button type="button" className="c4-chip" data-on={sort === "keeper" ? "1" : "0"} onClick={() => setSort((value) => value === "bearing" ? "keeper" : "bearing")}>{sort === "keeper" ? v4("anmSortKeeper") : v4("anmSortBearing")}</button>
        <button type="button" className="c4-chip" data-on={density === "close" ? "1" : "0"} onClick={() => storeDensity(density === "roomy" ? "close" : "roomy")}>{density === "roomy" ? v4("anmRoomy") : v4("anmClose")}</button>
        <button type="button" className="c4-chip" onClick={() => setSheet((value) => value === "rose" ? "index" : "rose")}>{sheet === "rose" ? v4("anmHall") : v4("anmIndex")}</button>
      </div>
      <div className="c4-anemo-tools">
        <select className="c4-select" aria-label={v4("anmKeeper")} value={keeperFilter} onChange={(event) => setKeeperFilter(event.target.value)}>
          <option value="all">{v4("anmAll")}</option>
          {keepers.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("anmLacquer")} value={lacquerFilter} onChange={(event) => setLacquerFilter(event.target.value)}>
          <option value="all">{v4("anmAll")}</option>
          {METALS.map((item) => <option key={item} value={item}>{lacquerLabel(v4, item.toUpperCase())}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("anmVane")} value={vaneFilter} onChange={(event) => setVaneFilter(event.target.value)}>
          <option value="all">{v4("anmAll")}</option>
          {VANES.map((item) => <option key={item} value={item}>{vaneLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("anmBearing")} value={bearingFilter} onChange={(event) => setBearingFilter(event.target.value)}>
          <option value="all">{v4("anmAll")}</option>
          <option value="keen">{v4("anmKeenBearing")}</option>
          <option value="still">{v4("anmStillBearing")}</option>
          {ANEMO_BEARINGS.map((item) => <option key={item} value={item}>{bearingLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("anmWatch")} value={watchFilter} onChange={(event) => setWatchFilter(event.target.value)}>
          <option value="all">{v4("anmAll")}</option>
          {WATCHES.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("anmBead")} value={beadFilter} onChange={(event) => setBeadFilter(event.target.value)}>
          <option value="all">{v4("anmAll")}</option>
          {BEADS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>
      <form className="c4-anemo-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addCup(cards, { id: `anm-${Date.now()}`, title, note, keeper, bearing, lacquer, vane, watch: watchMin, bead, tags });
        if (next.length === cards.length) return;
        store(next);
        setTitle("");
        setNote("");
        setTags("");
      }}>
        <label className="c4-lab"><span>{v4("anmTitleField")}</span><input className="c4-field" aria-label={v4("anmTitleField")} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("anmNote")}</span><input className="c4-field" aria-label={v4("anmNote")} aria-required={false} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <p className="c4-anemo-meta">{v4("anmNoteOptional")}</p>
        <label className="c4-lab"><span>{v4("anmKeeper")}</span><input className="c4-field" aria-label={v4("anmKeeper")} value={keeper} disabled={viewer} onChange={(event) => setKeeper(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("anmBearing")}</span>
          <select className="c4-select" aria-label={v4("anmBearing")} value={bearing} disabled={viewer} onChange={(event) => setBearing(event.target.value)}>
            <option value="">{v4("anmBlank")}</option>
            {ANEMO_BEARINGS.map((item) => <option key={item} value={item}>{bearingLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("anmLacquer")}</span>
          <select className="c4-select" aria-label={v4("anmLacquer")} value={lacquer} disabled={viewer} onChange={(event) => setLacquer(event.target.value)}>
            <option value="">{v4("anmBlankLacquer")}</option>
            {METALS.map((item) => <option key={item} value={item}>{lacquerLabel(v4, item.toUpperCase())}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("anmVane")}</span>
          <select className="c4-select" aria-label={v4("anmVane")} value={vane} disabled={viewer} onChange={(event) => setVane(event.target.value)}>
            <option value="">{v4("anmBlankVane")}</option>
            {VANES.map((item) => <option key={item} value={item}>{vaneLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("anmWatch")}</span>
          <select className="c4-select" aria-label={v4("anmWatch")} value={watchMin} disabled={viewer} onChange={(event) => setWatchMin(event.target.value)}>
            <option value="">{v4("anmBlankWatch")}</option>
            {WATCHES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("anmBead")}</span>
          <select className="c4-select" aria-label={v4("anmBead")} value={bead} disabled={viewer} onChange={(event) => setBead(event.target.value)}>
            {BEADS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("anmTags")}</span><input className="c4-field" aria-label={v4("anmTags")} value={tags} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("anmAdd")}</button>
      </form>
      <form className="c4-anemo-tools" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addCupView(views, { id: `view-${Date.now()}`, name: viewName, tray, query, keeper: keeperFilter, lacquer: lacquerFilter, vane: vaneFilter, bearing: bearingFilter, watch: watchFilter, bead: beadFilter });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <label className="c4-lab"><span>{v4("anmViewName")}</span><input className="c4-field" aria-label={v4("anmViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("anmSaveView")}</button>
        {views.map((view) => (
          <span key={view.id} className="c4-anemo-view">
            <button type="button" className="c4-btn" onClick={() => applyView(view)}>{v4("anmApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropCupView(views, view.id))}>{v4("anmDropView")}</button>
          </span>
        ))}
      </form>
      {picked.length > 0 && (
        <div className="c4-anemo-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkCupPin(cards, picked))}>{v4("anmBulkPin")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkCupStow(cards, picked))}>{v4("anmBulkSeal")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkCupEast(cards, picked))}>{v4("anmBulkEast")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkCupChampagne(cards, picked))}>{v4("anmBulkSilk")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkCupTag(cards, picked, "b"))}>{v4("anmBulkTag")}</button>
        </div>
      )}
      <p className="c4-anemo-meta">{v4("anmSuggest")} {lacquerLabel(v4, suggested)} · {v4("anmFair")} {fair} · {v4("anmBusy")} {busy || v4("anmBlankKeeper")} · {v4("anmNeighbors")} {neighborBeadCount(cards)} · {v4("anmClash")} {clashBearingCount(cards)} · {v4("anmWatchHint")} {suggestWatch(cards, clock)} · {v4("anmBearingHint")} {bearingLabel(v4, bearingHint)}</p>
      {(reminders.length > 0 || idling.length > 0) && (
        <p className="c4-anemo-meta">{v4("anmDue")} {reminders.map((card) => card.title).join(" · ")} · {v4("anmIdle")} {idling.map((card) => card.title).join(" · ")}</p>
      )}
      {!shown.length && <p className="c4-anemo-empty">{v4("anmEmpty")}</p>}
      <ol className={sheet === "index" ? "c4-anemo-index" : "c4-anemo-board"} data-density={density}>
        {shown.map((card, index) => {
          const dial = Math.round(((card.watch ?? 0) / 60) * 100);
          return (
            <li key={card.id} className="c4-anemo-cup" data-on={index === focusAt ? "1" : "0"} data-pinned={card.pinned ? "1" : "0"} data-overdue={overdueCup(card) ? "1" : "0"} data-keen={keenBearing(card.bearing) ? "1" : "0"} data-still={stillBearing(card.bearing) ? "1" : "0"} data-house={houseLacquer(card.lacquer) ? "1" : "0"} data-brisk={briskCup(card) ? "1" : "0"} data-idle={idleCup(card) ? "1" : "0"} data-resting={restingCup(card) ? "1" : "0"} data-late={lateCup(card, desk) ? "1" : "0"}>
              <div className="c4-anemo-ring" aria-hidden="true" style={{ background: `conic-gradient(#c6a15b ${dial}%, #efe6d6 ${dial}% 100%)` }}>
                <span>{(card.title[0] || "·").toUpperCase()}</span>
              </div>
              <label className="c4-anemo-pick"><input type="checkbox" checked={picked.includes(card.id)} aria-label={card.title} onChange={() => togglePick(card.id)} /></label>
              <div>
                <input className="c4-field" aria-label={v4("anmEdit")} value={card.title} disabled={viewer} onChange={(event) => store(editCup(cards, card.id, event.target.value))} />
                <input className="c4-field" aria-label={v4("anmEditNote")} aria-required={false} value={card.note} disabled={viewer} onChange={(event) => store(editCupNote(cards, card.id, event.target.value))} />
                <p className="c4-anemo-meta">{card.keeper || v4("anmBlankKeeper")} · {bearingLabel(v4, card.bearing)} · {lacquerLabel(v4, card.lacquer)} · {vaneLabel(v4, card.vane)} · {card.watch ?? v4("anmBlankWatch")} · {v4("anmBead")} {card.bead} · {card.tags.join(" ") || v4("anmTags")}</p>
                <p className="c4-anemo-meta">{bearingLabel(v4, desk)} · {AUDIT_KEY[card.audit] ? v4(AUDIT_KEY[card.audit]) : v4("anmAuditSave")}</p>
                <div className="c4-anemo-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCupPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("anmUnpin") : v4("anmPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer || card.sealed} onClick={() => store(setCupStay(cards, card.id, !card.paused))}>{card.paused ? v4("anmResume") : v4("anmPause")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCupStow(cards, card.id, !card.sealed))}>{card.sealed ? v4("anmOpenAgain") : v4("anmSealed")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCupStar(cards, card.id, !card.flagged))}>{card.flagged ? v4("anmUnstar") : v4("anmStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleVane(cards, card.id))}>{v4("anmTempo")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lengthenWatch(cards, card.id))}>{v4("anmLengthen")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(shortenWatch(cards, card.id))}>{v4("anmShorten")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseBead(cards, card.id))}>{v4("anmRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerBead(cards, card.id))}>{v4("anmLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCupLacquer(cards, card.id, card.lacquer === "CHAMPAGNE" ? "ivory" : "champagne"))}>{v4("anmLacquer")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addCupTag(cards, card.id, "c"))}>{v4("anmTags")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(cupCopy(card)); setCopied(card.id); }}>{copied === card.id ? v4("anmCopied") : v4("anmCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <button type="button" className="c4-btn" onClick={() => download("anemometer-cups.csv", cupCsv(shown, desk))}>{v4("anmCsv")}</button>
    </section>
  );
}

export function RetentionPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: NameRow[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [shape, setShape] = useState<RetentionShape>("all");
  const [review, setReview] = useState<RetentionReview>("all");
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [copied, setCopied] = useState("");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = useMemo<RetentionRow[]>(() => (queue.data?.users || []).map((row, index) => ({
    id: row.id ? `name-${row.id}` : `name-${index}`,
    label: textField(row.name),
    note: { retentionStatus: textField(row.retentionStatus) } satisfies RetentionValue,
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
    const present = presentRetentionLanes(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenRetentions(readJson(RTN_KEY, []), present);
    const nextReviewed = readReviewedRetentions(readJson(RTN_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(RTN_KEY, nextHidden);
    writeJson(RTN_REVIEW_KEY, nextReviewed);
  }, [rows]);
  const present = presentRetentionLanes(rows);
  const lanes = visibleRetentionLanes(present, hidden, showHidden);
  const shown = visibleRetentions(rows, lane, hue, query, review, reviewed, shape).filter((row) => {
    const token = retentionLane(row.note);
    if (!token) return true;
    return showHidden || !hidden.includes(token);
  });
  const focusAt = shown.length ? focus % shown.length : 0;
  const bars = retentionLanes(rows);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const lead = leadingRetention(rows);
  const leadHue = leadingRetentionHue(rows);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveAnemoFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveAnemoFocus(index, shown.length, -1));
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
  }, [shown, focusAt]);
  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(RTN_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(RTN_REVIEW_KEY, next);
  }
  return (
    <section className="c4-retention" aria-label={v4("rtnTitle")} data-plates="1" data-names={rows.length} data-role={role}>
      <header className="c4-retention-mast">
        <p className="c4-retention-seal" data-logo="mono">{v4("rtnLogo")}</p>
        <div>
          <p className="c4-retention-kicker">{v4("rtnSub")}</p>
          <h2 className="c4-title">{v4("rtnTitle")}</h2>
        </div>
      </header>
      <ol className="c4-retention-index" aria-label={v4("rtnTitle")}>
        <li data-tone="gold">{v4("rtnGrove")}</li>
        <li data-tone="ink">{v4("rtnCourt")}</li>
        <li data-tone="ivory">{v4("rtnShade")}</li>
        <li data-tone="mist">{v4("rtnVerge")}</li>
      </ol>
      <p className="c4-retention-links">
        <Link href={crmv4Href(base, "anm")}>{v4("rtnCups")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("anmCustomers")}</Link>
        <Link href={crmv4Href(base, "logs")}>{v4("logChronicleKicker")}</Link>
      </p>
      <p className="c4-retention-hint">{v4("rtnHint")}</p>
      {viewer && <p className="c4-retention-note">{v4("rtnViewer")}</p>}
      {queue.loading && <p className="c4-retention-meta">{v4("rtnEmpty")}</p>}
      {queue.error && <p className="c4-retention-meta">{queue.error}</p>}
      <ul className="c4-retention-kpis" aria-label={v4("rtnRules")}>
        <li><span>{v4("rtnLead")}</span><strong>{lead ? laneLabel(v4, lead) : v4("rtnUnmarked")}</strong></li>
        <li><span>{v4("rtnToneLead")}</span><strong>{leadHue ? hueLabel(v4, leadHue) : v4("rtnUnmarked")}</strong></li>
        <li><span>{v4("rtnShared")}</span><strong>{sharedRetentionCount(rows)}</strong></li>
        <li><span>{v4("rtnShare")}</span><strong>{retentionShare(laneRetentionCount(rows, "grove"), Math.max(1, rows.length))}%</strong></li>
        <li><span>{v4("rtnKnown")}</span><strong>{rows.filter((row) => retentionKnown(row.note)).length}</strong></li>
        <li><span>{v4("rtnTwin")}</span><strong>{rows.filter((row) => retentionTwin(row.note)).length}</strong></li>
        <li><span>{v4("rtnSlash")}</span><strong>{rows.filter((row) => retentionSlash(row.note)).length}</strong></li>
        <li><span>{v4("rtnEcho")}</span><strong>{rows.filter((row) => retentionEcho(row.note)).length}</strong></li>
      </ul>
      <div className="c4-retention-chart" aria-label={v4("rtnRules")}>
        {bars.map((bar) => (
          <button key={bar.lane} type="button" className="c4-retention-stake" data-on={lane === bar.lane ? "1" : "0"} data-lane={bar.lane} onClick={() => setLane(lane === bar.lane ? "all" : bar.lane)}>
            <i style={{ height: `${Math.max(6, Math.round((bar.count / maxBar) * 96))}px` }} />
            <strong>{bar.count}</strong>
            <span>{laneLabel(v4, bar.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-retention-tools">
        <input ref={searchRef} className="c4-field c4-retention-search" aria-label={v4("rtnSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("rtnSearch")} />
        {(["all", "ivory", "graphite", "champagne"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("rtnAll") : hueLabel(v4, item)}</button>
        ))}
        {(["all", "grove", "court", "shade", "verge", "wide", "notch", "leap", "slash", "twin", "known", "echo"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>
            {item === "all" ? v4("rtnShapeAll") : item === "wide" ? v4("rtnShapeWide") : item === "notch" ? v4("rtnShapeNotch") : item === "leap" ? v4("rtnShapeLeap") : item === "slash" ? v4("rtnShapeSlash") : item === "twin" ? v4("rtnShapeTwin") : item === "known" ? v4("rtnShapeKnown") : item === "echo" ? v4("rtnShapeEcho") : laneLabel(v4, item)}
          </button>
        ))}
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{item === "all" ? v4("rtnAll") : item === "reviewed" ? v4("rtnReviewed") : v4("rtnUnreviewed")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("rtnShow")}</button>
      </div>
      <ul className="c4-retention-lanes">
        {lanes.map((item) => (
          <li key={item}>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(toggleRetention(hidden, item))}>{hidden.includes(item) ? v4("rtnShow") : v4("rtnHide")} {laneLabel(v4, item)}</button>
          </li>
        ))}
      </ul>
      {picked.length > 0 && (
        <div className="c4-retention-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkRetentionReview(reviewed, picked, true))}>{v4("rtnBulkReview")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkRetentionReview(reviewed, picked, false))}>{v4("rtnBulkClear")}</button>
        </div>
      )}
      {!shown.length && <p className="c4-retention-empty">{v4("rtnEmpty")}</p>}
      <ol className="c4-retention-board">
        {shown.map((row, index) => {
          const seen = reviewed.includes(row.id);
          return (
            <li key={row.id} className="c4-retention-card" data-on={index === focusAt ? "1" : "0"} data-lane={retentionLane(row.note)} data-hue={retentionHue(row.note)} data-reviewed={seen ? "1" : "0"} data-known={retentionKnown(row.note) ? "1" : "0"}>
              <p className="c4-retention-stamp">{retentionStamp(row.note) || "·"}</p>
              <label className="c4-retention-pick"><input type="checkbox" checked={picked.includes(row.id)} aria-label={row.label || row.id} onChange={() => setPicked((current) => current.includes(row.id) ? current.filter((item) => item !== row.id) : [...current, row.id])} /></label>
              <div>
                <strong>{row.label || v4("rtnUnmarked")}</strong>
                <p className="c4-retention-meta">{laneLabel(v4, retentionLane(row.note))} · {hueLabel(v4, retentionHue(row.note))} · {v4("rtnStep")} {retentionStep(row.note)}{retentionCap(row.note) ? ` · ${v4("rtnCap")}` : ""}{retentionTail(row.note) ? ` · ${v4("rtnTail")}` : ""}{retentionWide(row.note) ? ` · ${v4("rtnWide")}` : ""}{retentionNotch(row.note) ? ` · ${v4("rtnNotch")}` : ""}{retentionLeap(row.note) ? ` · ${v4("rtnLeap")}` : ""}</p>
                <div className="c4-retention-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleRetentionReview(reviewed, row.id))}>{seen ? v4("rtnReviewed") : v4("rtnReview")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(retentionCopy(row.note)); setCopied(row.id); }}>{copied === row.id ? v4("rtnCopied") : v4("rtnCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="c4-retention-tools">
        <button type="button" className="c4-btn" onClick={() => download("retention-lanes.csv", retentionLanesCsv(rows))}>{v4("rtnCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("retention-rows.csv", retentionRowsCsv(shown, reviewed))}>{v4("rtnRowCsv")}</button>
      </div>
    </section>
  );
}
