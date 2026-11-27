"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  CMG_HIDE_KEY,
  CMG_REVIEW_KEY,
  FTK_DENSITY_KEY,
  FTK_KEY,
  FTK_PROFILES,
  FTK_VIEW_KEY,
  addFuttock,
  addFuttockTag,
  addFuttockView,
  bedFocused,
  briskFuttock,
  bulkCoamingReview,
  bulkFuttockLinen,
  bulkFuttockShelf,
  bulkFuttockRaise,
  bulkFuttockTag,
  busiestHand,
  dropFuttockView,
  editFuttock,
  editFuttockNote,
  fairHand,
  coamingBlank,
  coamingCopy,
  coamingDigit,
  coamingEven,
  coamingFar,
  coamingHue,
  coamingLane,
  coamingLanes,
  coamingLanesCsv,
  coamingLength,
  coamingLetter,
  coamingDark,
  coamingDim,
  coamingFade,
  coamingLit,
  coamingOpen,
  coamingRowsCsv,
  coamingShare,
  coamingSlice,
  coamingStamp,
  coamingNear,
  coamingUpper,
  idleFuttock,
  laneCoamingCount,
  lateFuttock,
  leadingCoaming,
  leadingCoamingHue,
  ivoryQuiet,
  lowerDepthFocused,
  lowerHourFocused,
  moveFuttockFocus,
  futtockBars,
  futtockCopy,
  futtockCounts,
  futtockCsv,
  futtockDensity,
  futtockHands,
  futtockTimeline,
  overdueFuttock,
  pinFuttockFocused,
  presentCoamingLanes,
  profileCool,
  profileWarm,
  rackFuttockFocused,
  raiseDepthFocused,
  raiseHourFocused,
  readHiddenCoaming,
  readReviewedCoaming,
  readFuttockViews,
  readFuttockList,
  reminderFuttockList,
  restingFuttock,
  setFuttockFocused,
  setFuttockBed,
  setFuttockPin,
  setFuttockRack,
  setFuttockRaised,
  setFuttockShelf,
  sortFuttockList,
  suggestProfile,
  suggestFuttockBed,
  suggestFuttockHour,
  toggleCoaming,
  toggleCoamingReview,
  visibleCoaming,
  visibleCoamingLanes,
  visibleFuttockList,
  type CoamingReview,
  type CoamingRow,
  type CoamingShape,
  type Futtock,
  type FuttockDensity,
  type FuttockRack,
  type FuttockSort,
  type FuttockView,
} from "@/lib/crmv4/round416";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const BEDS = ["IVORY", "GRAPHITE", "GILT"] as const;
const HOURS = ["3", "6", "12", "24"] as const;
const DEPTHS = ["1", "3", "9"] as const;

const PROFILE_KEY: Record<string, CrmV4CopyKey> = {
  futtock: "ftkFuttock",
  toptimber: "ftkToptimber",
  knighthead: "ftkKnighthead",
  cathead: "ftkCathead",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "ftkAuditSave",
  edit: "ftkAuditEdit",
  note: "ftkAuditNote",
  bed: "ftkAuditBed",
  raise: "ftkAuditRaise",
  free: "ftkAuditFree",
  press: "ftkAuditPress",
  return: "ftkAuditReturn",
  shelf: "ftkAuditShelf",
  open: "ftkAuditOpen",
  tag: "ftkAuditTag",
  depth: "ftkAuditDepth",
  hour: "ftkAuditHour",
  lower: "ftkAuditLower",
  pin: "ftkAuditPin",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  live: "cmgLaneLive",
  code: "cmgLaneCode",
  short: "cmgLaneShort",
  long: "cmgLaneLong",
  hold: "cmgLaneHold",
  shut: "cmgLaneShut",
  blank: "cmgLaneBlank",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  gilt: "cmgGilt",
  pearl: "cmgPearl",
  ash: "cmgAsh",
};

const SHAPE_KEY: Record<CoamingShape, CrmV4CopyKey> = {
  all: "cmgShapeAll",
  live: "cmgShapeLive",
  code: "cmgShapeCode",
  short: "cmgShapeShort",
  long: "cmgShapeLong",
  hold: "cmgShapeHold",
  shut: "cmgShapeShut",
  blank: "cmgShapeBlank",
  open: "cmgShapeOpen",
  digit: "cmgShapeDigit",
  letter: "cmgShapeLetter",
  even: "cmgShapeEven",
  upper: "cmgShapeUpper",
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
  return key ? v4(key) : v4("ftkBlankProfile");
}

function bedLabel(v4: V4, bed: string): string {
  if (bed === "IVORY") return v4("ftkLinen");
  if (bed === "GRAPHITE") return v4("ftkSlate");
  if (bed === "GILT") return v4("ftkGilt");
  return v4("ftkAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("cmgBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("cmgBlank");
}

export function FuttockCourses({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Futtock[]>([]);
  const [views, setViews] = useState<FuttockView[]>([]);
  const [density, setDensity] = useState<FuttockDensity>("open");
  const [rack, setRack] = useState<FuttockRack>("base");
  const [query, setQuery] = useState("");
  const [handFilter, setHandFilter] = useState("");
  const [bedFilter, setBedFilter] = useState("all");
  const [profileFilter, setProfileFilter] = useState("all");
  const [hourFilter, setHourFilter] = useState("all");
  const [depthFilter, setDepthFilter] = useState("all");
  const [sort, setSort] = useState<FuttockSort>("profile");
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
  const [station, setStation] = useState("futtock");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readFuttockList(readJson(FTK_KEY, [])));
    setViews(readFuttockViews(readJson(FTK_VIEW_KEY, [])));
    setDensity(futtockDensity(readJson(FTK_DENSITY_KEY, "open")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Futtock[]) {
    setCards(next);
    writeJson(FTK_KEY, next);
  }
  function storeViews(next: FuttockView[]) {
    setViews(next);
    writeJson(FTK_VIEW_KEY, next);
  }
  function storeDensity(next: FuttockDensity) {
    setDensity(next);
    writeJson(FTK_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortFuttockList(visibleFuttockList(cards, rack, query, handFilter, bedFilter, profileFilter, hourFilter, depthFilter), sort),
    [cards, rack, query, handFilter, bedFilter, profileFilter, hourFilter, depthFilter, sort],
  );
  const counts = futtockCounts(cards, shown, station);
  const bars = futtockBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = futtockTimeline(cards);
  const reminders = reminderFuttockList(cards);
  const hands = futtockHands(cards);
  const busy = busiestHand(cards);
  const fair = fairHand(cards, hands.join(","));
  const suggestedBed = suggestFuttockBed(cards);
  const suggestedHour = suggestFuttockHour(cards, clock);
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
        download("futtock-courses.csv", futtockCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveFuttockFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveFuttockFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addFuttock(cards, { title, note, hand, profile, hour: hourNo, bed, depth: depthNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-ftk416" aria-label={v4("ftkTitle")} data-ftk416="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-ftk416-mast">
        <p className="c4-ftk416-seal" data-logo="mono">{v4("ftkLogo")}</p>
        <div>
          <p className="c4-ftk416-kicker">{v4("ftkSub")}</p>
          <h2 className="c4-title">{v4("ftkTitle")}</h2>
        </div>
        <p className="c4-ftk416-count">{shown.length}</p>
      </header>
      <p className="c4-ftk416-links">
        <Link href={crmv4Href(base, "cmg")}>{v4("cmgTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("ftkCustomers")}</Link>
      </p>
      <p className="c4-ftk416-hint">{v4("ftkHint")}</p>
      {viewer && <p className="c4-ftk416-note">{v4("ftkViewer")}</p>}
      <p className="c4-ftk416-meta">{v4("ftkFair")} {fair || "—"} · {v4("ftkBusy")} {busy || "—"} · {v4("ftkSuggest")} {profileLabel(v4, suggestedProfile)} · {bedLabel(v4, suggestedBed)} · {suggestedHour}</p>
      <ol className="c4-ftk416-index" aria-label={v4("ftkRemind")}>
        <li data-tone="gold">{v4("ftkOverdue")} {counts.overdue}</li>
        <li data-tone="pitch">{v4("ftkIdle")} {counts.idle}</li>
        <li data-tone="mist">{v4("ftkBrisk")} {counts.brisk}</li>
        <li data-tone="mist">{v4("ftkResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-ftk416-remind c4-ftk416-notices" role="status" aria-label={v4("ftkRemind")}>
          {reminders.map((name) => <li key={name}>{v4("ftkOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-ftk416-chart" aria-label={v4("ftkChart")}>
        {bars.map((bar) => (
          <button key={bar.profile} type="button" className="c4-ftk416-column" data-on={profileFilter === bar.profile ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === bar.profile ? "all" : bar.profile)}>
            <i style={{ width: `${Math.max(18, Math.round((bar.count / peak) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{profileLabel(v4, bar.profile)}</span>
          </button>
        ))}
      </div>
      <form className="c4-ftk416-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("ftkEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("ftkEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("ftkNote")}<input className="c4-field" aria-label={v4("ftkNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("ftkHand")}<input className="c4-field" aria-label={v4("ftkHand")} aria-required={false} value={hand} maxLength={24} disabled={viewer} onChange={(event) => setHand(event.target.value)} /></label>
        <label className="c4-lab">{v4("ftkProfile")}<select className="c4-field" aria-label={v4("ftkProfile")} value={profile} disabled={viewer} onChange={(event) => setProfile(event.target.value)}><option value="">{v4("ftkBlankProfile")}</option>{FTK_PROFILES.map((item) => <option key={item} value={item}>{profileLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("ftkBed")}<select className="c4-field" aria-label={v4("ftkBed")} value={bed} disabled={viewer} onChange={(event) => setBed(event.target.value)}><option value="">{v4("ftkAll")}</option>{BEDS.map((item) => <option key={item} value={item}>{bedLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("ftkHour")}<select className="c4-field" aria-label={v4("ftkHour")} value={hourNo} disabled={viewer} onChange={(event) => setHourNo(event.target.value)}><option value="">{v4("ftkAll")}</option>{HOURS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("ftkDepth")}<select className="c4-field" aria-label={v4("ftkDepth")} value={depthNo} disabled={viewer} onChange={(event) => setDepthNo(event.target.value)}><option value="">{v4("ftkAll")}</option>{DEPTHS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("ftkTag")}<input className="c4-field" aria-label={v4("ftkTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("ftkAdd")}</button>
      </form>
      <div className="c4-ftk416-tools">
        <input ref={searchRef} className="c4-field c4-ftk416-search" aria-label={v4("ftkSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("ftkSearch")} />
        {(["base", "press", "shelf"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={rack === item ? "1" : "0"} onClick={() => setRack(item)}>{v4(item === "base" ? "ftkYard" : item === "press" ? "ftkPress" : "ftkShelf")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={profileFilter === "warm" ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === "warm" ? "all" : "warm")}>{v4("ftkWarm")}</button>
        <button type="button" className="c4-chip" data-on={profileFilter === "cool" ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === "cool" ? "all" : "cool")}>{v4("ftkCool")}</button>
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
        <button type="button" className="c4-chip" data-on={sort === "hand" ? "1" : "0"} onClick={() => setSort(sort === "hand" ? "profile" : "hand")}>{sort === "hand" ? v4("ftkSortHand") : v4("ftkSortProfile")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "open" : "tight")}>{density === "tight" ? v4("ftkTight") : v4("ftkOpenDensity")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("ftkTimeline")}</button>
        <label className="c4-lab">{v4("ftkDesk")}<select className="c4-field" aria-label={v4("ftkDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{FTK_PROFILES.map((item) => <option key={item} value={item}>{profileLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-ftk416-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addFuttockView(views, { id, name: viewName, rack, query, hand: handFilter, bed: bedFilter, profile: profileFilter, hour: hourFilter, depth: depthFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("ftkViewName")}<input className="c4-field" aria-label={v4("ftkViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("ftkSaveView")}</button>
      </form>
      <ul className="c4-ftk416-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setRack(view.rack); setQuery(view.query); setHandFilter(view.hand); setBedFilter(view.bed); setProfileFilter(view.profile); setHourFilter(view.hour); setDepthFilter(view.depth); }}>{v4("ftkApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropFuttockView(views, view.id))}>{v4("ftkDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-ftk416-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkFuttockRaise(cards, picked))}>{v4("ftkBulkRaise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkFuttockShelf(cards, picked))}>{v4("ftkBulkArchive")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkFuttockLinen(cards, picked))}>{v4("ftkBulkLinen")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkFuttockTag(cards, picked))}>{v4("ftkBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("futtock-courses.csv", futtockCsv(shown, station))}>{v4("ftkCsv")}</button>
        <p className="c4-ftk416-meta">{v4("ftkKeys")} / c x a j k · {v4("ftkQuiet")} {counts.quiet} · {v4("ftkWarm")} {counts.warm}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-ftk416-time" aria-label={v4("ftkTimeline")}>
          {timeline.map((row) => <li key={row.hour}><span>{row.hour}</span> {row.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("ftkEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-ftk416-list">
          {shown.map((card) => {
            const late = lateFuttock(card, station);
            return (
              <li key={card.id} className="c4-ftk416-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleFuttock(card) ? "1" : "0"} data-brisk={briskFuttock(card) ? "1" : "0"} data-overdue={overdueFuttock(card) ? "1" : "0"} data-resting={restingFuttock(card) ? "1" : "0"} data-warm={profileWarm(card.profile) ? "1" : "0"} data-cool={profileCool(card.profile) ? "1" : "0"} data-quiet={ivoryQuiet(card.bed) ? "1" : "0"}>
                <label className="c4-ftk416-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editFuttock(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("ftkEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("ftkApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editFuttockNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("ftkNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-ftk416-meta">{profileLabel(v4, card.profile)} · {bedLabel(v4, card.bed)} · {card.hour ?? "—"} · {card.depth} · {card.hand || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "ftkAuditSave")}` : ""}{late ? ` · ${v4("ftkOverdue")}` : ""}</p>
                </div>
                <div className="c4-ftk416-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("ftkEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setFuttockRaised(cards, card.id, !card.raised))}>{card.raised ? v4("ftkFree") : v4("ftkRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setFuttockBed(cards, card.id, suggestedBed))}>{v4("ftkSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setFuttockRack(cards, card.id, !card.pressed))}>{card.pressed ? v4("ftkUnpress") : v4("ftkPressIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setFuttockShelf(cards, card.id, !card.shelved))}>{card.shelved ? v4("ftkUnshelf") : v4("ftkShelfIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setFuttockPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("ftkUnpin") : v4("ftkPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addFuttockTag(cards, card.id, "t"))}>{v4("ftkTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHourFocused(cards, card.id))}>{v4("ftkRaiseHour")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHourFocused(cards, card.id))}>{v4("ftkLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseDepthFocused(cards, card.id))}>{v4("ftkDepth")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerDepthFocused(cards, card.id))}>{v4("ftkDepth")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bedFocused(cards, card.id))}>{v4("ftkBed")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setFuttockFocused(cards, card.id))}>{v4("ftkRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(rackFuttockFocused(cards, card.id))}>{v4("ftkPress")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinFuttockFocused(cards, card.id))}>{v4("ftkPin")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(futtockCopy(card))}>{v4("ftkCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type GroupUser = { id?: string; name?: string | null; retentionStatus?: unknown };

export function CoamingPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: GroupUser[] }>("/api/admin/users?take=24&meta=0");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<CoamingShape>("all");
  const [review, setReview] = useState<CoamingReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): CoamingRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      userId: id,
      code: coamingSlice(row),
    };
  }).filter((row): row is CoamingRow => Boolean(row));
  const present = presentCoamingLanes(rows);
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
    const next = readHiddenCoaming(readJson(CMG_HIDE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(CMG_HIDE_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedCoaming(readJson(CMG_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(CMG_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleCoamingLanes(present, hidden, showHidden);
  const shown = visibleCoaming(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = coamingLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = coamingLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingCoaming(rows);
  const leadHue = leadingCoamingHue(rows);
  const whole = rows.filter((row) => coamingLane(row.code)).length;
  const share = coamingShare(laneCoamingCount(rows, "live"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("coaming-retention-lanes.csv", coamingLanesCsv(rows));
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
    writeJson(CMG_HIDE_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(CMG_REVIEW_KEY, next);
  }

  return (
    <section className="c4-cmg416" aria-label={v4("cmgTitle")} data-cmg416="1" data-role={role} data-retention="1">
      <header className="c4-cmg416-mast">
        <p className="c4-cmg416-seal" data-logo="mono">{v4("cmgLogo")}</p>
        <div>
          <p className="c4-cmg416-kicker">{v4("cmgSub")}</p>
          <h2 className="c4-title">{v4("cmgTitle")}</h2>
        </div>
        <p className="c4-cmg416-count">{shown.length}</p>
      </header>
      <p className="c4-cmg416-links">
        <Link href={crmv4Href(base, "ftk")}>{v4("ftkTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("cmgCustomer")}</Link>
      </p>
      <p className="c4-cmg416-hint">{v4("cmgHint")}</p>
      {viewer && <p className="c4-cmg416-note">{v4("cmgViewer")}</p>}
      {queue.loading && <p className="c4-cmg416-meta">{v4("cmgLoading")}</p>}
      {queue.error && <p className="c4-cmg416-meta">{v4("cmgFailed")}</p>}
      <p className="c4-cmg416-meta">{v4("cmgLead")} {laneLabel(v4, lead)} · {v4("cmgToneLead")} {hueLabel(v4, leadHue)} · {v4("cmgShare")} {share}</p>
      <div className="c4-cmg416-chart" aria-label={v4("cmgChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-cmg416-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ width: `${Math.max(18, Math.round((line.count / peak) * 100))}%` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-cmg416-tools">
        <input ref={searchRef} className="c4-field c4-cmg416-search" aria-label={v4("cmgSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("cmgSearch")} />
        <label className="c4-lab">{v4("cmgChart")}<select className="c4-field" aria-label={v4("cmgChart")} value={shape} onChange={(event) => setShape(event.target.value as CoamingShape)}>{(Object.keys(SHAPE_KEY) as CoamingShape[]).map((item) => <option key={item} value={item}>{v4(SHAPE_KEY[item])}</option>)}</select></label>
        <button type="button" className="c4-chip" data-on={hue === "gilt" ? "1" : "0"} onClick={() => setHue(hue === "gilt" ? "all" : "gilt")}>{v4("cmgGilt")}</button>
        <button type="button" className="c4-chip" data-on={hue === "pearl" ? "1" : "0"} onClick={() => setHue(hue === "pearl" ? "all" : "pearl")}>{v4("cmgPearl")}</button>
        <button type="button" className="c4-chip" data-on={hue === "ash" ? "1" : "0"} onClick={() => setHue(hue === "ash" ? "all" : "ash")}>{v4("cmgAsh")}</button>
        <button type="button" className="c4-chip" data-on={review === "fresh" ? "1" : "0"} onClick={() => setReview(review === "fresh" ? "all" : "fresh")}>{v4("cmgFresh")}</button>
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview(review === "reviewed" ? "all" : "reviewed")}>{v4("cmgReviewed")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{v4("cmgShow")}</button>
        {present.map((lane) => (
          <button key={lane} type="button" className="c4-chip" data-on={hidden.includes(lane) ? "1" : "0"} onClick={() => storeHidden(toggleCoaming(hidden, lane))}>{v4("cmgHide")} {laneLabel(v4, lane)}</button>
        ))}
      </div>
      <div className="c4-cmg416-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkCoamingReview(reviewed, picked, true))}>{v4("cmgBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkCoamingReview(reviewed, picked, false))}>{v4("cmgBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("coaming-retention-rows.csv", coamingRowsCsv(shown, reviewed))}>{v4("cmgRowCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("coaming-retention-marks.csv", coamingLanesCsv(rows))}>{v4("cmgCsv")}</button>
      </div>
      {!shown.length && !queue.loading && <p className="c4-pay-empty">{v4("cmgEmpty")}</p>}
      <ul className="c4-cmg416-list">
        {shown.map((row) => {
          const tone = coamingHue(row.code);
          const name = coamingCopy(row.code);
          return (
            <li key={row.id} className="c4-cmg416-card" data-mail={coamingLane(row.code) || "open"} data-hue={tone || "none"} data-lit={coamingLit(row.code) ? "1" : "0"} data-figure={coamingNear(row.code) ? "1" : "0"} data-short={coamingFar(row.code) ? "1" : "0"} data-long={coamingFade(row.code) ? "1" : "0"} data-dark={coamingDark(row.code) ? "1" : "0"} data-dim={coamingDim(row.code) ? "1" : "0"} data-blank={coamingBlank(row.code) ? "1" : "0"} data-open={coamingOpen(row.code) ? "1" : "0"} data-even={coamingEven(row.code) ? "1" : "0"} data-digit={coamingDigit(row.code) ? "1" : "0"} data-letter={coamingLetter(row.code) ? "1" : "0"} data-upper={coamingUpper(row.code) ? "1" : "0"}>
              <label className="c4-cmg416-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-cmg416-meta">{name || v4("cmgOpen")} · {coamingStamp(row.code) || "—"} · {coamingLength(row.code) ?? "—"} · {laneLabel(v4, coamingLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-cmg416-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleCoamingReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("cmgReviewed") : v4("cmgReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { navigator.clipboard?.writeText(coamingCopy(row.code)); setCopied(row.id); }}>{copied === row.id ? v4("cmgCopied") : v4("cmgCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.userId || row.id}`)}>{v4("cmgCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
