"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  PSC_HIDE_KEY,
  PSC_REVIEW_KEY,
  ARC_DENSITY_KEY,
  ARC_KEY,
  ARC_PROFILES,
  ARC_VIEW_KEY,
  addArchitrave,
  addArchitraveTag,
  addArchitraveView,
  bedFocused,
  briskArchitrave,
  bulkProsceniumReview,
  bulkArchitraveLinen,
  bulkArchitraveShelf,
  bulkArchitraveRaise,
  bulkArchitraveTag,
  busiestHand,
  dropArchitraveView,
  editArchitrave,
  editArchitraveNote,
  fairHand,
  prosceniumBlank,
  prosceniumCopy,
  prosceniumDigit,
  prosceniumEven,
  prosceniumFar,
  prosceniumHue,
  prosceniumLane,
  prosceniumLanes,
  prosceniumLanesCsv,
  prosceniumLength,
  prosceniumLetter,
  prosceniumDark,
  prosceniumDim,
  prosceniumFade,
  prosceniumLit,
  prosceniumOpen,
  prosceniumRowsCsv,
  prosceniumShare,
  prosceniumSlice,
  prosceniumStamp,
  prosceniumNear,
  prosceniumUpper,
  idleArchitrave,
  laneProsceniumCount,
  lateArchitrave,
  leadingProscenium,
  leadingProsceniumHue,
  graphiteQuiet,
  lowerDepthFocused,
  lowerHourFocused,
  moveArchitraveFocus,
  architraveBars,
  architraveCopy,
  architraveCounts,
  architraveCsv,
  architraveDensity,
  architraveHands,
  architraveTimeline,
  overdueArchitrave,
  pinArchitraveFocused,
  presentProsceniumLanes,
  profileCool,
  profileWarm,
  rackArchitraveFocused,
  raiseDepthFocused,
  raiseHourFocused,
  readHiddenProscenium,
  readReviewedProscenium,
  readArchitraveViews,
  readArchitraveList,
  reminderArchitraveList,
  restingArchitrave,
  setArchitraveFocused,
  setArchitraveBed,
  setArchitravePin,
  setArchitraveRack,
  setArchitraveRaised,
  setArchitraveShelf,
  sortArchitraveList,
  suggestProfile,
  suggestArchitraveBed,
  suggestArchitraveHour,
  toggleProscenium,
  toggleProsceniumReview,
  visibleProscenium,
  visibleProsceniumLanes,
  visibleArchitraveList,
  type ProsceniumReview,
  type ProsceniumRow,
  type ProsceniumShape,
  type Architrave,
  type ArchitraveDensity,
  type ArchitraveRack,
  type ArchitraveSort,
  type ArchitraveView,
} from "@/lib/crmv4/round410";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const BEDS = ["IVORY", "GRAPHITE", "GILT"] as const;
const HOURS = ["2", "7", "11", "18"] as const;
const DEPTHS = ["4", "7", "11"] as const;

const PROFILE_KEY: Record<string, CrmV4CopyKey> = {
  architrave: "atvArchitrave",
  impluvium: "atvImpluvium",
  lararium: "atvLararium",
  squinch: "atvSquinch",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "atvAuditSave",
  edit: "atvAuditEdit",
  note: "atvAuditNote",
  bed: "atvAuditBed",
  raise: "atvAuditRaise",
  free: "atvAuditFree",
  press: "atvAuditPress",
  return: "atvAuditReturn",
  shelf: "atvAuditShelf",
  open: "atvAuditOpen",
  tag: "atvAuditTag",
  depth: "atvAuditDepth",
  hour: "atvAuditHour",
  lower: "atvAuditLower",
  pin: "atvAuditPin",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  live: "pscLaneLive",
  code: "pscLaneCode",
  short: "pscLaneShort",
  long: "pscLaneLong",
  hold: "pscLaneHold",
  shut: "pscLaneShut",
  blank: "pscLaneBlank",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  gilt: "pscGilt",
  pearl: "pscPearl",
  ash: "pscAsh",
};

const SHAPE_KEY: Record<ProsceniumShape, CrmV4CopyKey> = {
  all: "pscShapeAll",
  live: "pscShapeLive",
  code: "pscShapeCode",
  short: "pscShapeShort",
  long: "pscShapeLong",
  hold: "pscShapeHold",
  shut: "pscShapeShut",
  blank: "pscShapeBlank",
  open: "pscShapeOpen",
  digit: "pscShapeDigit",
  letter: "pscShapeLetter",
  even: "pscShapeEven",
  upper: "pscShapeUpper",
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
  return key ? v4(key) : v4("atvBlankProfile");
}

function bedLabel(v4: V4, bed: string): string {
  if (bed === "IVORY") return v4("atvLinen");
  if (bed === "GRAPHITE") return v4("atvSlate");
  if (bed === "GILT") return v4("atvGilt");
  return v4("atvAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("pscBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("pscBlank");
}

export function ArchitraveCourses({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Architrave[]>([]);
  const [views, setViews] = useState<ArchitraveView[]>([]);
  const [density, setDensity] = useState<ArchitraveDensity>("open");
  const [rack, setRack] = useState<ArchitraveRack>("base");
  const [query, setQuery] = useState("");
  const [handFilter, setHandFilter] = useState("");
  const [bedFilter, setBedFilter] = useState("all");
  const [profileFilter, setProfileFilter] = useState("all");
  const [hourFilter, setHourFilter] = useState("all");
  const [depthFilter, setDepthFilter] = useState("all");
  const [sort, setSort] = useState<ArchitraveSort>("profile");
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
  const [station, setStation] = useState("architrave");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readArchitraveList(readJson(ARC_KEY, [])));
    setViews(readArchitraveViews(readJson(ARC_VIEW_KEY, [])));
    setDensity(architraveDensity(readJson(ARC_DENSITY_KEY, "open")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Architrave[]) {
    setCards(next);
    writeJson(ARC_KEY, next);
  }
  function storeViews(next: ArchitraveView[]) {
    setViews(next);
    writeJson(ARC_VIEW_KEY, next);
  }
  function storeDensity(next: ArchitraveDensity) {
    setDensity(next);
    writeJson(ARC_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortArchitraveList(visibleArchitraveList(cards, rack, query, handFilter, bedFilter, profileFilter, hourFilter, depthFilter), sort),
    [cards, rack, query, handFilter, bedFilter, profileFilter, hourFilter, depthFilter, sort],
  );
  const counts = architraveCounts(cards, shown, station);
  const bars = architraveBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = architraveTimeline(cards);
  const reminders = reminderArchitraveList(cards);
  const hands = architraveHands(cards);
  const busy = busiestHand(cards);
  const fair = fairHand(cards, hands.join(","));
  const suggestedBed = suggestArchitraveBed(cards);
  const suggestedHour = suggestArchitraveHour(cards, clock);
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
        download("architrave-courses.csv", architraveCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveArchitraveFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveArchitraveFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addArchitrave(cards, { title, note, hand, profile, hour: hourNo, bed, depth: depthNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-architrave" aria-label={v4("atvTitle")} data-architrave="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-architrave-mast">
        <p className="c4-architrave-seal" data-logo="mono">{v4("atvLogo")}</p>
        <div>
          <p className="c4-architrave-kicker">{v4("atvSub")}</p>
          <h2 className="c4-title">{v4("atvTitle")}</h2>
        </div>
        <p className="c4-architrave-count">{shown.length}</p>
      </header>
      <p className="c4-architrave-links">
        <Link href={crmv4Href(base, "psc")}>{v4("pscTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("atvCustomers")}</Link>
      </p>
      <p className="c4-architrave-hint">{v4("atvHint")}</p>
      {viewer && <p className="c4-architrave-note">{v4("atvViewer")}</p>}
      <p className="c4-architrave-meta">{v4("atvFair")} {fair || "—"} · {v4("atvBusy")} {busy || "—"} · {v4("atvSuggest")} {profileLabel(v4, suggestedProfile)} · {bedLabel(v4, suggestedBed)} · {suggestedHour}</p>
      <ol className="c4-architrave-index" aria-label={v4("atvRemind")}>
        <li data-tone="gold">{v4("atvOverdue")} {counts.overdue}</li>
        <li data-tone="pitch">{v4("atvIdle")} {counts.idle}</li>
        <li data-tone="mist">{v4("atvBrisk")} {counts.brisk}</li>
        <li data-tone="mist">{v4("atvResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-architrave-remind c4-architrave-notices" role="status" aria-label={v4("atvRemind")}>
          {reminders.map((name) => <li key={name}>{v4("atvOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-architrave-chart" aria-label={v4("atvChart")}>
        {bars.map((bar) => (
          <button key={bar.profile} type="button" className="c4-architrave-column" data-on={profileFilter === bar.profile ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === bar.profile ? "all" : bar.profile)}>
            <i style={{ width: `${Math.max(18, Math.round((bar.count / peak) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{profileLabel(v4, bar.profile)}</span>
          </button>
        ))}
      </div>
      <form className="c4-architrave-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("atvEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("atvEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("atvNote")}<input className="c4-field" aria-label={v4("atvNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("atvHand")}<input className="c4-field" aria-label={v4("atvHand")} aria-required={false} value={hand} maxLength={24} disabled={viewer} onChange={(event) => setHand(event.target.value)} /></label>
        <label className="c4-lab">{v4("atvProfile")}<select className="c4-field" aria-label={v4("atvProfile")} value={profile} disabled={viewer} onChange={(event) => setProfile(event.target.value)}><option value="">{v4("atvBlankProfile")}</option>{ARC_PROFILES.map((item) => <option key={item} value={item}>{profileLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("atvBed")}<select className="c4-field" aria-label={v4("atvBed")} value={bed} disabled={viewer} onChange={(event) => setBed(event.target.value)}><option value="">{v4("atvAll")}</option>{BEDS.map((item) => <option key={item} value={item}>{bedLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("atvHour")}<select className="c4-field" aria-label={v4("atvHour")} value={hourNo} disabled={viewer} onChange={(event) => setHourNo(event.target.value)}><option value="">{v4("atvAll")}</option>{HOURS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("atvDepth")}<select className="c4-field" aria-label={v4("atvDepth")} value={depthNo} disabled={viewer} onChange={(event) => setDepthNo(event.target.value)}><option value="">{v4("atvAll")}</option>{DEPTHS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("atvTag")}<input className="c4-field" aria-label={v4("atvTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("atvAdd")}</button>
      </form>
      <div className="c4-architrave-tools">
        <input ref={searchRef} className="c4-field c4-architrave-search" aria-label={v4("atvSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("atvSearch")} />
        {(["base", "press", "shelf"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={rack === item ? "1" : "0"} onClick={() => setRack(item)}>{v4(item === "base" ? "atvYard" : item === "press" ? "atvPress" : "atvShelf")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={profileFilter === "warm" ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === "warm" ? "all" : "warm")}>{v4("atvWarm")}</button>
        <button type="button" className="c4-chip" data-on={profileFilter === "cool" ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === "cool" ? "all" : "cool")}>{v4("atvCool")}</button>
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
        <button type="button" className="c4-chip" data-on={sort === "hand" ? "1" : "0"} onClick={() => setSort(sort === "hand" ? "profile" : "hand")}>{sort === "hand" ? v4("atvSortHand") : v4("atvSortProfile")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "open" : "tight")}>{density === "tight" ? v4("atvTight") : v4("atvOpenDensity")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("atvTimeline")}</button>
        <label className="c4-lab">{v4("atvDesk")}<select className="c4-field" aria-label={v4("atvDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{ARC_PROFILES.map((item) => <option key={item} value={item}>{profileLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-architrave-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addArchitraveView(views, { id, name: viewName, rack, query, hand: handFilter, bed: bedFilter, profile: profileFilter, hour: hourFilter, depth: depthFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("atvViewName")}<input className="c4-field" aria-label={v4("atvViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("atvSaveView")}</button>
      </form>
      <ul className="c4-architrave-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setRack(view.rack); setQuery(view.query); setHandFilter(view.hand); setBedFilter(view.bed); setProfileFilter(view.profile); setHourFilter(view.hour); setDepthFilter(view.depth); }}>{v4("atvApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropArchitraveView(views, view.id))}>{v4("atvDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-architrave-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkArchitraveRaise(cards, picked))}>{v4("atvBulkRaise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkArchitraveShelf(cards, picked))}>{v4("atvBulkArchive")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkArchitraveLinen(cards, picked))}>{v4("atvBulkLinen")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkArchitraveTag(cards, picked))}>{v4("atvBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("architrave-courses.csv", architraveCsv(shown, station))}>{v4("atvCsv")}</button>
        <p className="c4-architrave-meta">{v4("atvKeys")} / c x a j k · {v4("atvQuiet")} {counts.quiet} · {v4("atvWarm")} {counts.warm}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-architrave-time" aria-label={v4("atvTimeline")}>
          {timeline.map((row) => <li key={row.hour}><span>{row.hour}</span> {row.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("atvEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-architrave-list">
          {shown.map((card) => {
            const late = lateArchitrave(card, station);
            return (
              <li key={card.id} className="c4-architrave-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleArchitrave(card) ? "1" : "0"} data-brisk={briskArchitrave(card) ? "1" : "0"} data-overdue={overdueArchitrave(card) ? "1" : "0"} data-resting={restingArchitrave(card) ? "1" : "0"} data-warm={profileWarm(card.profile) ? "1" : "0"} data-cool={profileCool(card.profile) ? "1" : "0"} data-quiet={graphiteQuiet(card.bed) ? "1" : "0"}>
                <label className="c4-architrave-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editArchitrave(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("atvEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("atvApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editArchitraveNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("atvNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-architrave-meta">{profileLabel(v4, card.profile)} · {bedLabel(v4, card.bed)} · {card.hour ?? "—"} · {card.depth} · {card.hand || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "atvAuditSave")}` : ""}{late ? ` · ${v4("atvOverdue")}` : ""}</p>
                </div>
                <div className="c4-architrave-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("atvEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setArchitraveRaised(cards, card.id, !card.raised))}>{card.raised ? v4("atvFree") : v4("atvRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setArchitraveBed(cards, card.id, suggestedBed))}>{v4("atvSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setArchitraveRack(cards, card.id, !card.pressed))}>{card.pressed ? v4("atvUnpress") : v4("atvPressIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setArchitraveShelf(cards, card.id, !card.shelved))}>{card.shelved ? v4("atvUnshelf") : v4("atvShelfIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setArchitravePin(cards, card.id, !card.pinned))}>{card.pinned ? v4("atvUnpin") : v4("atvPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addArchitraveTag(cards, card.id, "a"))}>{v4("atvTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHourFocused(cards, card.id))}>{v4("atvRaiseHour")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHourFocused(cards, card.id))}>{v4("atvLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseDepthFocused(cards, card.id))}>{v4("atvDepth")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerDepthFocused(cards, card.id))}>{v4("atvDepth")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bedFocused(cards, card.id))}>{v4("atvBed")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setArchitraveFocused(cards, card.id))}>{v4("atvRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(rackArchitraveFocused(cards, card.id))}>{v4("atvPress")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinArchitraveFocused(cards, card.id))}>{v4("atvPin")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(architraveCopy(card))}>{v4("atvCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type GroupUser = { id?: string; name?: string | null; accountType?: unknown };

export function ProsceniumPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: GroupUser[] }>("/api/admin/users?take=24&meta=0");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<ProsceniumShape>("all");
  const [review, setReview] = useState<ProsceniumReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): ProsceniumRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      userId: id,
      code: prosceniumSlice(row),
    };
  }).filter((row): row is ProsceniumRow => Boolean(row));
  const present = presentProsceniumLanes(rows);
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
    const next = readHiddenProscenium(readJson(PSC_HIDE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(PSC_HIDE_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedProscenium(readJson(PSC_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(PSC_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleProsceniumLanes(present, hidden, showHidden);
  const shown = visibleProscenium(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = prosceniumLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = prosceniumLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingProscenium(rows);
  const leadHue = leadingProsceniumHue(rows);
  const whole = rows.filter((row) => prosceniumLane(row.code)).length;
  const share = prosceniumShare(laneProsceniumCount(rows, "live"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("proscenium-type-lanes.csv", prosceniumLanesCsv(rows));
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
    writeJson(PSC_HIDE_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(PSC_REVIEW_KEY, next);
  }

  return (
    <section className="c4-proscenium" aria-label={v4("pscTitle")} data-proscenium="1" data-role={role} data-type="1">
      <header className="c4-proscenium-mast">
        <p className="c4-proscenium-seal" data-logo="mono">{v4("pscLogo")}</p>
        <div>
          <p className="c4-proscenium-kicker">{v4("pscSub")}</p>
          <h2 className="c4-title">{v4("pscTitle")}</h2>
        </div>
        <p className="c4-proscenium-count">{shown.length}</p>
      </header>
      <p className="c4-proscenium-links">
        <Link href={crmv4Href(base, "arc")}>{v4("atvTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("pscCustomer")}</Link>
      </p>
      <p className="c4-proscenium-hint">{v4("pscHint")}</p>
      {viewer && <p className="c4-proscenium-note">{v4("pscViewer")}</p>}
      {queue.loading && <p className="c4-proscenium-meta">{v4("pscLoading")}</p>}
      {queue.error && <p className="c4-proscenium-meta">{v4("pscFailed")}</p>}
      <p className="c4-proscenium-meta">{v4("pscLead")} {laneLabel(v4, lead)} · {v4("pscToneLead")} {hueLabel(v4, leadHue)} · {v4("pscShare")} {share}</p>
      <div className="c4-proscenium-chart" aria-label={v4("pscChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-proscenium-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ width: `${Math.max(18, Math.round((line.count / peak) * 100))}%` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-proscenium-tools">
        <input ref={searchRef} className="c4-field c4-proscenium-search" aria-label={v4("pscSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("pscSearch")} />
        <label className="c4-lab">{v4("pscChart")}<select className="c4-field" aria-label={v4("pscChart")} value={shape} onChange={(event) => setShape(event.target.value as ProsceniumShape)}>{(Object.keys(SHAPE_KEY) as ProsceniumShape[]).map((item) => <option key={item} value={item}>{v4(SHAPE_KEY[item])}</option>)}</select></label>
        <button type="button" className="c4-chip" data-on={hue === "gilt" ? "1" : "0"} onClick={() => setHue(hue === "gilt" ? "all" : "gilt")}>{v4("pscGilt")}</button>
        <button type="button" className="c4-chip" data-on={hue === "pearl" ? "1" : "0"} onClick={() => setHue(hue === "pearl" ? "all" : "pearl")}>{v4("pscPearl")}</button>
        <button type="button" className="c4-chip" data-on={hue === "ash" ? "1" : "0"} onClick={() => setHue(hue === "ash" ? "all" : "ash")}>{v4("pscAsh")}</button>
        <button type="button" className="c4-chip" data-on={review === "fresh" ? "1" : "0"} onClick={() => setReview(review === "fresh" ? "all" : "fresh")}>{v4("pscFresh")}</button>
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview(review === "reviewed" ? "all" : "reviewed")}>{v4("pscReviewed")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{v4("pscShow")}</button>
        {present.map((lane) => (
          <button key={lane} type="button" className="c4-chip" data-on={hidden.includes(lane) ? "1" : "0"} onClick={() => storeHidden(toggleProscenium(hidden, lane))}>{v4("pscHide")} {laneLabel(v4, lane)}</button>
        ))}
      </div>
      <div className="c4-proscenium-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkProsceniumReview(reviewed, picked, true))}>{v4("pscBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkProsceniumReview(reviewed, picked, false))}>{v4("pscBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("proscenium-type-rows.csv", prosceniumRowsCsv(shown, reviewed))}>{v4("pscRowCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("proscenium-type-marks.csv", prosceniumLanesCsv(rows))}>{v4("pscCsv")}</button>
      </div>
      {!shown.length && !queue.loading && <p className="c4-pay-empty">{v4("pscEmpty")}</p>}
      <ul className="c4-proscenium-list">
        {shown.map((row) => {
          const tone = prosceniumHue(row.code);
          const name = prosceniumCopy(row.code);
          return (
            <li key={row.id} className="c4-proscenium-card" data-mail={prosceniumLane(row.code) || "open"} data-hue={tone || "none"} data-lit={prosceniumLit(row.code) ? "1" : "0"} data-figure={prosceniumNear(row.code) ? "1" : "0"} data-short={prosceniumFar(row.code) ? "1" : "0"} data-long={prosceniumFade(row.code) ? "1" : "0"} data-dark={prosceniumDark(row.code) ? "1" : "0"} data-dim={prosceniumDim(row.code) ? "1" : "0"} data-blank={prosceniumBlank(row.code) ? "1" : "0"} data-open={prosceniumOpen(row.code) ? "1" : "0"} data-even={prosceniumEven(row.code) ? "1" : "0"} data-digit={prosceniumDigit(row.code) ? "1" : "0"} data-letter={prosceniumLetter(row.code) ? "1" : "0"} data-upper={prosceniumUpper(row.code) ? "1" : "0"}>
              <label className="c4-proscenium-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-proscenium-meta">{name || v4("pscOpen")} · {prosceniumStamp(row.code) || "—"} · {prosceniumLength(row.code) ?? "—"} · {laneLabel(v4, prosceniumLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-proscenium-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleProsceniumReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("pscReviewed") : v4("pscReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { navigator.clipboard?.writeText(prosceniumCopy(row.code)); setCopied(row.id); }}>{copied === row.id ? v4("pscCopied") : v4("pscCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.userId || row.id}`)}>{v4("pscCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
