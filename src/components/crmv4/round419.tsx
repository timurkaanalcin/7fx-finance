"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  GDG_HIDE_KEY,
  GDG_REVIEW_KEY,
  WSB_DENSITY_KEY,
  WSB_KEY,
  WSB_PROFILES,
  WSB_VIEW_KEY,
  addWashboard,
  addWashboardTag,
  addWashboardView,
  bedFocused,
  briskWashboard,
  bulkGudgeonReview,
  bulkWashboardLinen,
  bulkWashboardShelf,
  bulkWashboardRaise,
  bulkWashboardTag,
  busiestHand,
  dropWashboardView,
  editWashboard,
  editWashboardNote,
  fairHand,
  gudgeonBlank,
  gudgeonCopy,
  gudgeonDigit,
  gudgeonEven,
  gudgeonFar,
  gudgeonHue,
  gudgeonLane,
  gudgeonLanes,
  gudgeonLanesCsv,
  gudgeonLength,
  gudgeonLetter,
  gudgeonDark,
  gudgeonDim,
  gudgeonFade,
  gudgeonLit,
  gudgeonOpen,
  gudgeonRowsCsv,
  gudgeonShare,
  gudgeonSlice,
  gudgeonStamp,
  gudgeonNear,
  gudgeonUpper,
  idleWashboard,
  laneGudgeonCount,
  lateWashboard,
  leadingGudgeon,
  leadingGudgeonHue,
  ivoryQuiet,
  lowerDepthFocused,
  lowerHourFocused,
  moveWashboardFocus,
  washboardBars,
  washboardCopy,
  washboardCounts,
  washboardCsv,
  washboardDensity,
  washboardHands,
  washboardTimeline,
  overdueWashboard,
  pinWashboardFocused,
  presentGudgeonLanes,
  profileCool,
  profileWarm,
  rackWashboardFocused,
  raiseDepthFocused,
  raiseHourFocused,
  readHiddenGudgeon,
  readReviewedGudgeon,
  readWashboardViews,
  readWashboardList,
  reminderWashboardList,
  restingWashboard,
  setWashboardFocused,
  setWashboardBed,
  setWashboardPin,
  setWashboardRack,
  setWashboardRaised,
  setWashboardShelf,
  sortWashboardList,
  suggestProfile,
  suggestWashboardBed,
  suggestWashboardHour,
  toggleGudgeon,
  toggleGudgeonReview,
  visibleGudgeon,
  visibleGudgeonLanes,
  visibleWashboardList,
  type GudgeonReview,
  type GudgeonRow,
  type GudgeonShape,
  type Washboard,
  type WashboardDensity,
  type WashboardRack,
  type WashboardSort,
  type WashboardView,
} from "@/lib/crmv4/round419";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const BEDS = ["IVORY", "GRAPHITE", "GILT"] as const;
const HOURS = ["3", "6", "12", "24"] as const;
const DEPTHS = ["1", "3", "6"] as const;

const PROFILE_KEY: Record<string, CrmV4CopyKey> = {
  washboard: "wsbWashboard",
  bobstay: "wsbBobstay",
  jibboom: "wsbJibboom",
  skeg: "wsbSkeg",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "wsbAuditSave",
  edit: "wsbAuditEdit",
  note: "wsbAuditNote",
  bed: "wsbAuditBed",
  raise: "wsbAuditRaise",
  free: "wsbAuditFree",
  press: "wsbAuditPress",
  return: "wsbAuditReturn",
  shelf: "wsbAuditShelf",
  open: "wsbAuditOpen",
  tag: "wsbAuditTag",
  depth: "wsbAuditDepth",
  hour: "wsbAuditHour",
  lower: "wsbAuditLower",
  pin: "wsbAuditPin",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  live: "gdgLaneLive",
  code: "gdgLaneCode",
  short: "gdgLaneShort",
  long: "gdgLaneLong",
  hold: "gdgLaneHold",
  shut: "gdgLaneShut",
  blank: "gdgLaneBlank",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  gilt: "gdgGilt",
  pearl: "gdgPearl",
  ash: "gdgAsh",
};

const SHAPE_KEY: Record<GudgeonShape, CrmV4CopyKey> = {
  all: "gdgShapeAll",
  live: "gdgShapeLive",
  code: "gdgShapeCode",
  short: "gdgShapeShort",
  long: "gdgShapeLong",
  hold: "gdgShapeHold",
  shut: "gdgShapeShut",
  blank: "gdgShapeBlank",
  open: "gdgShapeOpen",
  digit: "gdgShapeDigit",
  letter: "gdgShapeLetter",
  even: "gdgShapeEven",
  upper: "gdgShapeUpper",
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

function profileLabel(v4: V4, profile: string): string {
  const key = PROFILE_KEY[profile];
  return key ? v4(key) : v4("wsbBlankProfile");
}

function bedLabel(v4: V4, bed: string): string {
  if (bed === "IVORY") return v4("wsbLinen");
  if (bed === "GRAPHITE") return v4("wsbSlate");
  if (bed === "GILT") return v4("wsbGilt");
  return v4("wsbAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("gdgBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("gdgBlank");
}

export function WashboardCourses({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Washboard[]>([]);
  const [views, setViews] = useState<WashboardView[]>([]);
  const [density, setDensity] = useState<WashboardDensity>("open");
  const [rack, setRack] = useState<WashboardRack>("base");
  const [query, setQuery] = useState("");
  const [handFilter, setHandFilter] = useState("");
  const [bedFilter, setBedFilter] = useState("all");
  const [profileFilter, setProfileFilter] = useState("all");
  const [hourFilter, setHourFilter] = useState("all");
  const [depthFilter, setDepthFilter] = useState("all");
  const [sort, setSort] = useState<WashboardSort>("profile");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [hand, setHand] = useState("");
  const [profile, setProfile] = useState("");
  const [bed, setBed] = useState("");
  const [hourNo, setHourNo] = useState("");
  const [depthNo, setDepthNo] = useState("");
  const [tags, setTags] = useState("");
  const [viewName, setViewName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focusAt, setFocusAt] = useState(0);
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteId, setNoteId] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [station, setStation] = useState("washboard");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readWashboardList(readJson(WSB_KEY, [])));
    setViews(readWashboardViews(readJson(WSB_VIEW_KEY, [])));
    setDensity(washboardDensity(readJson(WSB_DENSITY_KEY, "open")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Washboard[]) {
    setCards(next);
    writeJson(WSB_KEY, next);
  }
  function storeViews(next: WashboardView[]) {
    setViews(next);
    writeJson(WSB_VIEW_KEY, next);
  }
  function storeDensity(next: WashboardDensity) {
    setDensity(next);
    writeJson(WSB_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortWashboardList(visibleWashboardList(cards, rack, query, handFilter, bedFilter, profileFilter, hourFilter, depthFilter), sort),
    [cards, rack, query, handFilter, bedFilter, profileFilter, hourFilter, depthFilter, sort],
  );
  const counts = washboardCounts(cards, shown, station);
  const bars = washboardBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = washboardTimeline(cards);
  const reminders = reminderWashboardList(cards);
  const hands = washboardHands(cards);
  const busy = busiestHand(cards);
  const fair = fairHand(cards, hands.join(","));
  const suggestedBed = suggestWashboardBed(cards);
  const suggestedHour = suggestWashboardHour(cards, clock);
  const suggestedProfile = suggestProfile(clock);
  const focused = shown[Math.min(focusAt, Math.max(0, shown.length - 1))];

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "/" && !typingTarget(event)) {
        event.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (typingTarget(event) || viewer) return;
      if (event.key === "c" || event.key === "C") {
        event.preventDefault();
        titleRef.current?.focus();
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("washboard-courses.csv", washboardCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveWashboardFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveWashboardFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addWashboard(cards, { title, note, hand, profile, hour: hourNo, bed, depth: depthNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-wsb419" aria-label={v4("wsbTitle")} data-wsb419="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-wsb419-mast">
        <p className="c4-wsb419-seal" data-logo="mono">{v4("wsbLogo")}</p>
        <div>
          <p className="c4-wsb419-kicker">{v4("wsbSub")}</p>
          <h2 className="c4-title">{v4("wsbTitle")}</h2>
        </div>
        <p className="c4-wsb419-count">{shown.length}</p>
      </header>
      <p className="c4-wsb419-links">
        <Link href={crmv4Href(base, "gdg")}>{v4("gdgTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("wsbCustomers")}</Link>
      </p>
      <p className="c4-wsb419-hint">{v4("wsbHint")}</p>
      {viewer && <p className="c4-wsb419-note">{v4("wsbViewer")}</p>}
      <p className="c4-wsb419-meta">{v4("wsbFair")} {fair || "—"} · {v4("wsbBusy")} {busy || "—"} · {v4("wsbSuggest")} {profileLabel(v4, suggestedProfile)} · {bedLabel(v4, suggestedBed)} · {suggestedHour}</p>
      <ol className="c4-wsb419-index" aria-label={v4("wsbRemind")}>
        <li data-tone="gold">{v4("wsbOverdue")} {counts.overdue}</li>
        <li data-tone="pitch">{v4("wsbIdle")} {counts.idle}</li>
        <li data-tone="mist">{v4("wsbBrisk")} {counts.brisk}</li>
        <li data-tone="mist">{v4("wsbResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-wsb419-remind c4-wsb419-notices" role="status" aria-label={v4("wsbRemind")}>
          {reminders.map((name) => <li key={name}>{v4("wsbOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-wsb419-chart" aria-label={v4("wsbChart")}>
        {bars.map((bar) => (
          <button key={bar.profile} type="button" className="c4-wsb419-column" data-on={profileFilter === bar.profile ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === bar.profile ? "all" : bar.profile)}>
            <i style={{ width: `${Math.max(18, Math.round((bar.count / peak) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{profileLabel(v4, bar.profile)}</span>
          </button>
        ))}
      </div>
      <form className="c4-wsb419-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("wsbEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("wsbEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("wsbNote")}<input className="c4-field" aria-label={v4("wsbNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("wsbHand")}<input className="c4-field" aria-label={v4("wsbHand")} aria-required={false} value={hand} maxLength={24} disabled={viewer} onChange={(event) => setHand(event.target.value)} /></label>
        <label className="c4-lab">{v4("wsbProfile")}<select className="c4-field" aria-label={v4("wsbProfile")} value={profile} disabled={viewer} onChange={(event) => setProfile(event.target.value)}><option value="">{v4("wsbBlankProfile")}</option>{WSB_PROFILES.map((item) => <option key={item} value={item}>{profileLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("wsbBed")}<select className="c4-field" aria-label={v4("wsbBed")} value={bed} disabled={viewer} onChange={(event) => setBed(event.target.value)}><option value="">{v4("wsbAll")}</option>{BEDS.map((item) => <option key={item} value={item}>{bedLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("wsbHour")}<select className="c4-field" aria-label={v4("wsbHour")} value={hourNo} disabled={viewer} onChange={(event) => setHourNo(event.target.value)}><option value="">{v4("wsbAll")}</option>{HOURS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("wsbDepth")}<select className="c4-field" aria-label={v4("wsbDepth")} value={depthNo} disabled={viewer} onChange={(event) => setDepthNo(event.target.value)}><option value="">{v4("wsbAll")}</option>{DEPTHS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("wsbTag")}<input className="c4-field" aria-label={v4("wsbTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("wsbAdd")}</button>
      </form>
      <div className="c4-wsb419-tools">
        <input ref={searchRef} className="c4-field c4-wsb419-search" aria-label={v4("wsbSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("wsbSearch")} />
        {(["base", "press", "shelf"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={rack === item ? "1" : "0"} onClick={() => setRack(item)}>{v4(item === "base" ? "wsbYard" : item === "press" ? "wsbPress" : "wsbShelf")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={profileFilter === "warm" ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === "warm" ? "all" : "warm")}>{v4("wsbWarm")}</button>
        <button type="button" className="c4-chip" data-on={profileFilter === "cool" ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === "cool" ? "all" : "cool")}>{v4("wsbCool")}</button>
        {BEDS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={bedFilter === item ? "1" : "0"} onClick={() => setBedFilter(bedFilter === item ? "all" : item)}>{bedLabel(v4, item)}</button>
        ))}
        {HOURS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hourFilter === item ? "1" : "0"} onClick={() => setHourFilter(hourFilter === item ? "all" : item)}>{item}</button>
        ))}
        {DEPTHS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={depthFilter === item ? "1" : "0"} onClick={() => setDepthFilter(depthFilter === item ? "all" : item)}>{item}</button>
        ))}
        {hands.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={handFilter === name ? "1" : "0"} onClick={() => setHandFilter(handFilter === name ? "" : name)}>{name}</button>
        ))}
        <button type="button" className="c4-chip" data-on={sort === "hand" ? "1" : "0"} onClick={() => setSort(sort === "hand" ? "profile" : "hand")}>{sort === "hand" ? v4("wsbSortHand") : v4("wsbSortProfile")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "open" : "tight")}>{density === "tight" ? v4("wsbTight") : v4("wsbOpenDensity")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("wsbTimeline")}</button>
        <label className="c4-lab">{v4("wsbDesk")}<select className="c4-field" aria-label={v4("wsbDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{WSB_PROFILES.map((item) => <option key={item} value={item}>{profileLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-wsb419-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addWashboardView(views, { id, name: viewName, rack, query, hand: handFilter, bed: bedFilter, profile: profileFilter, hour: hourFilter, depth: depthFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("wsbViewName")}<input className="c4-field" aria-label={v4("wsbViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("wsbSaveView")}</button>
      </form>
      <ul className="c4-wsb419-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setRack(view.rack); setQuery(view.query); setHandFilter(view.hand); setBedFilter(view.bed); setProfileFilter(view.profile); setHourFilter(view.hour); setDepthFilter(view.depth); }}>{v4("wsbApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropWashboardView(views, view.id))}>{v4("wsbDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-wsb419-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkWashboardRaise(cards, picked))}>{v4("wsbBulkRaise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkWashboardShelf(cards, picked))}>{v4("wsbBulkArchive")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkWashboardLinen(cards, picked))}>{v4("wsbBulkLinen")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkWashboardTag(cards, picked))}>{v4("wsbBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("washboard-courses.csv", washboardCsv(shown, station))}>{v4("wsbCsv")}</button>
        <p className="c4-wsb419-meta">{v4("wsbKeys")} / c x a j k · {v4("wsbQuiet")} {counts.quiet} · {v4("wsbWarm")} {counts.warm}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-wsb419-time" aria-label={v4("wsbTimeline")}>
          {timeline.map((row) => <li key={row.hour}><span>{row.hour}</span> {row.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("wsbEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-wsb419-list">
          {shown.map((card) => {
            const late = lateWashboard(card, station);
            return (
              <li key={card.id} className="c4-wsb419-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleWashboard(card) ? "1" : "0"} data-brisk={briskWashboard(card) ? "1" : "0"} data-overdue={overdueWashboard(card) ? "1" : "0"} data-resting={restingWashboard(card) ? "1" : "0"} data-warm={profileWarm(card.profile) ? "1" : "0"} data-cool={profileCool(card.profile) ? "1" : "0"} data-quiet={ivoryQuiet(card.bed) ? "1" : "0"}>
                <label className="c4-wsb419-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editWashboard(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("wsbEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("wsbApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editWashboardNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("wsbNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-wsb419-meta">{profileLabel(v4, card.profile)} · {bedLabel(v4, card.bed)} · {card.hour ?? "—"} · {card.depth} · {card.hand || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "wsbAuditSave")}` : ""}{late ? ` · ${v4("wsbOverdue")}` : ""}</p>
                </div>
                <div className="c4-wsb419-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("wsbEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setWashboardRaised(cards, card.id, !card.raised))}>{card.raised ? v4("wsbFree") : v4("wsbRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setWashboardBed(cards, card.id, suggestedBed))}>{v4("wsbSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setWashboardRack(cards, card.id, !card.pressed))}>{card.pressed ? v4("wsbUnpress") : v4("wsbPressIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setWashboardShelf(cards, card.id, !card.shelved))}>{card.shelved ? v4("wsbUnshelf") : v4("wsbShelfIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setWashboardPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("wsbUnpin") : v4("wsbPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addWashboardTag(cards, card.id, "v"))}>{v4("wsbTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHourFocused(cards, card.id))}>{v4("wsbRaiseHour")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHourFocused(cards, card.id))}>{v4("wsbLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseDepthFocused(cards, card.id))}>{v4("wsbDepth")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerDepthFocused(cards, card.id))}>{v4("wsbDepth")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bedFocused(cards, card.id))}>{v4("wsbBed")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setWashboardFocused(cards, card.id))}>{v4("wsbRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(rackWashboardFocused(cards, card.id))}>{v4("wsbPress")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinWashboardFocused(cards, card.id))}>{v4("wsbPin")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(washboardCopy(card))}>{v4("wsbCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type GroupUser = { id?: string; name?: string | null; lastSeenAt?: unknown };

export function GudgeonPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: GroupUser[] }>("/api/admin/users?take=24&meta=0");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<GudgeonShape>("all");
  const [review, setReview] = useState<GudgeonReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): GudgeonRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      userId: id,
      code: gudgeonSlice(row),
    };
  }).filter((row): row is GudgeonRow => Boolean(row));
  const present = presentGudgeonLanes(rows);
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
    const next = readHiddenGudgeon(readJson(GDG_HIDE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(GDG_HIDE_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedGudgeon(readJson(GDG_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(GDG_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleGudgeonLanes(present, hidden, showHidden);
  const shown = visibleGudgeon(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = gudgeonLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = gudgeonLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingGudgeon(rows);
  const leadHue = leadingGudgeonHue(rows);
  const whole = rows.filter((row) => gudgeonLane(row.code)).length;
  const share = gudgeonShare(laneGudgeonCount(rows, "live"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("gudgeon-seen-lanes.csv", gudgeonLanesCsv(rows));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((row) => row.id));
        return;
      }
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [rows, shown]);

  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(GDG_HIDE_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(GDG_REVIEW_KEY, next);
  }

  return (
    <section className="c4-gdg419" aria-label={v4("gdgTitle")} data-gdg419="1" data-role={role} data-seen="1">
      <header className="c4-gdg419-mast">
        <p className="c4-gdg419-seal" data-logo="mono">{v4("gdgLogo")}</p>
        <div>
          <p className="c4-gdg419-kicker">{v4("gdgSub")}</p>
          <h2 className="c4-title">{v4("gdgTitle")}</h2>
        </div>
        <p className="c4-gdg419-count">{shown.length}</p>
      </header>
      <p className="c4-gdg419-links">
        <Link href={crmv4Href(base, "wsb")}>{v4("wsbTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("gdgCustomer")}</Link>
      </p>
      <p className="c4-gdg419-hint">{v4("gdgHint")}</p>
      {viewer && <p className="c4-gdg419-note">{v4("gdgViewer")}</p>}
      {queue.loading && <p className="c4-gdg419-meta">{v4("gdgLoading")}</p>}
      {queue.error && <p className="c4-gdg419-meta">{v4("gdgFailed")}</p>}
      <p className="c4-gdg419-meta">{v4("gdgLead")} {laneLabel(v4, lead)} · {v4("gdgToneLead")} {hueLabel(v4, leadHue)} · {v4("gdgShare")} {share}</p>
      <div className="c4-gdg419-chart" aria-label={v4("gdgChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-gdg419-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ width: `${Math.max(18, Math.round((line.count / peak) * 100))}%` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-gdg419-tools">
        <input ref={searchRef} className="c4-field c4-gdg419-search" aria-label={v4("gdgSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("gdgSearch")} />
        <label className="c4-lab">{v4("gdgChart")}<select className="c4-field" aria-label={v4("gdgChart")} value={shape} onChange={(event) => setShape(event.target.value as GudgeonShape)}>{(Object.keys(SHAPE_KEY) as GudgeonShape[]).map((item) => <option key={item} value={item}>{v4(SHAPE_KEY[item])}</option>)}</select></label>
        <button type="button" className="c4-chip" data-on={hue === "gilt" ? "1" : "0"} onClick={() => setHue(hue === "gilt" ? "all" : "gilt")}>{v4("gdgGilt")}</button>
        <button type="button" className="c4-chip" data-on={hue === "pearl" ? "1" : "0"} onClick={() => setHue(hue === "pearl" ? "all" : "pearl")}>{v4("gdgPearl")}</button>
        <button type="button" className="c4-chip" data-on={hue === "ash" ? "1" : "0"} onClick={() => setHue(hue === "ash" ? "all" : "ash")}>{v4("gdgAsh")}</button>
        <button type="button" className="c4-chip" data-on={review === "fresh" ? "1" : "0"} onClick={() => setReview(review === "fresh" ? "all" : "fresh")}>{v4("gdgFresh")}</button>
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview(review === "reviewed" ? "all" : "reviewed")}>{v4("gdgReviewed")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{v4("gdgShow")}</button>
        {present.map((lane) => (
          <button key={lane} type="button" className="c4-chip" data-on={hidden.includes(lane) ? "1" : "0"} onClick={() => storeHidden(toggleGudgeon(hidden, lane))}>{v4("gdgHide")} {laneLabel(v4, lane)}</button>
        ))}
      </div>
      <div className="c4-gdg419-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkGudgeonReview(reviewed, picked, true))}>{v4("gdgBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkGudgeonReview(reviewed, picked, false))}>{v4("gdgBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("gudgeon-seen-rows.csv", gudgeonRowsCsv(shown, reviewed))}>{v4("gdgRowCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("gudgeon-seen-marks.csv", gudgeonLanesCsv(rows))}>{v4("gdgCsv")}</button>
      </div>
      {!shown.length && !queue.loading && <p className="c4-pay-empty">{v4("gdgEmpty")}</p>}
      <ul className="c4-gdg419-list">
        {shown.map((row) => {
          const tone = gudgeonHue(row.code);
          const name = gudgeonCopy(row.code);
          return (
            <li key={row.id} className="c4-gdg419-card" data-mail={gudgeonLane(row.code) || "open"} data-hue={tone || "none"} data-lit={gudgeonLit(row.code) ? "1" : "0"} data-figure={gudgeonNear(row.code) ? "1" : "0"} data-short={gudgeonFar(row.code) ? "1" : "0"} data-long={gudgeonFade(row.code) ? "1" : "0"} data-dark={gudgeonDark(row.code) ? "1" : "0"} data-dim={gudgeonDim(row.code) ? "1" : "0"} data-blank={gudgeonBlank(row.code) ? "1" : "0"} data-open={gudgeonOpen(row.code) ? "1" : "0"} data-even={gudgeonEven(row.code) ? "1" : "0"} data-digit={gudgeonDigit(row.code) ? "1" : "0"} data-letter={gudgeonLetter(row.code) ? "1" : "0"} data-upper={gudgeonUpper(row.code) ? "1" : "0"}>
              <label className="c4-gdg419-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-gdg419-meta">{name || v4("gdgOpen")} · {gudgeonStamp(row.code) || "—"} · {gudgeonLength(row.code) ?? "—"} · {laneLabel(v4, gudgeonLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-gdg419-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleGudgeonReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("gdgReviewed") : v4("gdgReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { navigator.clipboard?.writeText(gudgeonCopy(row.code)); setCopied(row.id); }}>{copied === row.id ? v4("gdgCopied") : v4("gdgCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.userId || row.id}`)}>{v4("gdgCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function MethodPintleHead({ v4, title }: { v4: V4; title: string }) {
  return (
    <header className="c4-method-pintle-mast">
      <p className="c4-method-pintle-seal" data-logo="mono">{v4("iplPintleLogo")}</p>
      <div>
        <p className="c4-method-pintle-kicker">{v4("iplPintleKicker")}</p>
        <h3 className="c4-title">{title}</h3>
        <p className="c4-method-pintle-lead">{v4("iplPintleLead")}</p>
      </div>
    </header>
  );
}

export function AssetBreasthookHead({ v4, title }: { v4: V4; title: string }) {
  return (
    <header className="c4-asset-breasthook-mast">
      <p className="c4-asset-breasthook-seal" data-logo="mono">{v4("gbhBreasthookLogo")}</p>
      <div>
        <p className="c4-asset-breasthook-kicker">{v4("gbhBreasthookKicker")}</p>
        <h3 className="c4-title">{title}</h3>
        <p className="c4-asset-breasthook-lead">{v4("gbhBreasthookLead")}</p>
      </div>
    </header>
  );
}
