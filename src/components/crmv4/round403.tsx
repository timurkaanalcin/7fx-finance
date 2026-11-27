"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  MND_HIDE_KEY,
  MND_REVIEW_KEY,
  BCR_DENSITY_KEY,
  BCR_KEY,
  BCR_PROFILES,
  BCR_VIEW_KEY,
  addBucrane,
  addBucraneTag,
  addBucraneView,
  bedFocused,
  briskBucrane,
  bulkMeanderReview,
  bulkBucraneLinen,
  bulkBucraneShelf,
  bulkBucraneRaise,
  bulkBucraneTag,
  busiestHand,
  dropBucraneView,
  editBucrane,
  editBucraneNote,
  fairHand,
  meanderBlank,
  meanderCopy,
  meanderDigit,
  meanderEven,
  meanderFar,
  meanderHue,
  meanderLane,
  meanderLanes,
  meanderLanesCsv,
  meanderLength,
  meanderLetter,
  meanderDark,
  meanderDim,
  meanderFade,
  meanderLit,
  meanderOpen,
  meanderRowsCsv,
  meanderShare,
  meanderSlice,
  meanderStamp,
  meanderNear,
  meanderUpper,
  idleBucrane,
  laneMeanderCount,
  lateBucrane,
  leadingMeander,
  leadingMeanderHue,
  ivoryQuiet,
  lowerDepthFocused,
  lowerHourFocused,
  moveBucraneFocus,
  bucraneBars,
  bucraneCopy,
  bucraneCounts,
  bucraneCsv,
  bucraneDensity,
  bucraneHands,
  bucraneTimeline,
  overdueBucrane,
  pinBucraneFocused,
  presentMeanderLanes,
  profileCool,
  profileWarm,
  rackBucraneFocused,
  raiseDepthFocused,
  raiseHourFocused,
  readHiddenMeander,
  readReviewedMeander,
  readBucraneViews,
  readBucraneList,
  reminderBucraneList,
  restingBucrane,
  setBucraneFocused,
  setBucraneBed,
  setBucranePin,
  setBucraneRack,
  setBucraneRaised,
  setBucraneShelf,
  sortBucraneList,
  suggestProfile,
  suggestBucraneBed,
  suggestBucraneHour,
  toggleMeander,
  toggleMeanderReview,
  visibleMeander,
  visibleMeanderLanes,
  visibleBucraneList,
  type MeanderReview,
  type MeanderRow,
  type MeanderShape,
  type Bucrane,
  type BucraneDensity,
  type BucraneRack,
  type BucraneSort,
  type BucraneView,
} from "@/lib/crmv4/round403";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const BEDS = ["IVORY", "GRAPHITE", "GILT"] as const;
const HOURS = ["5", "9", "13", "18"] as const;
const DEPTHS = ["5", "9", "13"] as const;

const PROFILE_KEY: Record<string, CrmV4CopyKey> = {
  bucrane: "bcrBucrane",
  garland: "bcrGarland",
  festoon: "bcrFestoon",
  swag: "bcrSwag",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "bcrAuditSave",
  edit: "bcrAuditEdit",
  note: "bcrAuditNote",
  bed: "bcrAuditBed",
  raise: "bcrAuditRaise",
  free: "bcrAuditFree",
  press: "bcrAuditPress",
  return: "bcrAuditReturn",
  shelf: "bcrAuditShelf",
  open: "bcrAuditOpen",
  tag: "bcrAuditTag",
  depth: "bcrAuditDepth",
  hour: "bcrAuditHour",
  lower: "bcrAuditLower",
  pin: "bcrAuditPin",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  live: "mndLaneLive",
  code: "mndLaneCode",
  short: "mndLaneShort",
  long: "mndLaneLong",
  hold: "mndLaneHold",
  shut: "mndLaneShut",
  blank: "mndLaneBlank",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  gilt: "mndGilt",
  pearl: "mndPearl",
  ash: "mndAsh",
};

const SHAPE_KEY: Record<MeanderShape, CrmV4CopyKey> = {
  all: "mndShapeAll",
  live: "mndShapeLive",
  code: "mndShapeCode",
  short: "mndShapeShort",
  long: "mndShapeLong",
  hold: "mndShapeHold",
  shut: "mndShapeShut",
  blank: "mndShapeBlank",
  open: "mndShapeOpen",
  digit: "mndShapeDigit",
  letter: "mndShapeLetter",
  even: "mndShapeEven",
  upper: "mndShapeUpper",
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
  return key ? v4(key) : v4("bcrBlankProfile");
}

function bedLabel(v4: V4, bed: string): string {
  if (bed === "IVORY") return v4("bcrLinen");
  if (bed === "GRAPHITE") return v4("bcrSlate");
  if (bed === "GILT") return v4("bcrGilt");
  return v4("bcrAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("mndBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("mndBlank");
}

export function BucraneCourses({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Bucrane[]>([]);
  const [views, setViews] = useState<BucraneView[]>([]);
  const [density, setDensity] = useState<BucraneDensity>("open");
  const [rack, setRack] = useState<BucraneRack>("base");
  const [query, setQuery] = useState("");
  const [handFilter, setHandFilter] = useState("");
  const [bedFilter, setBedFilter] = useState("all");
  const [profileFilter, setProfileFilter] = useState("all");
  const [hourFilter, setHourFilter] = useState("all");
  const [depthFilter, setDepthFilter] = useState("all");
  const [sort, setSort] = useState<BucraneSort>("profile");
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
  const [station, setStation] = useState("bucrane");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readBucraneList(readJson(BCR_KEY, [])));
    setViews(readBucraneViews(readJson(BCR_VIEW_KEY, [])));
    setDensity(bucraneDensity(readJson(BCR_DENSITY_KEY, "open")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Bucrane[]) {
    setCards(next);
    writeJson(BCR_KEY, next);
  }
  function storeViews(next: BucraneView[]) {
    setViews(next);
    writeJson(BCR_VIEW_KEY, next);
  }
  function storeDensity(next: BucraneDensity) {
    setDensity(next);
    writeJson(BCR_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortBucraneList(visibleBucraneList(cards, rack, query, handFilter, bedFilter, profileFilter, hourFilter, depthFilter), sort),
    [cards, rack, query, handFilter, bedFilter, profileFilter, hourFilter, depthFilter, sort],
  );
  const counts = bucraneCounts(cards, shown, station);
  const bars = bucraneBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = bucraneTimeline(cards);
  const reminders = reminderBucraneList(cards);
  const hands = bucraneHands(cards);
  const busy = busiestHand(cards);
  const fair = fairHand(cards, hands.join(","));
  const suggestedBed = suggestBucraneBed(cards);
  const suggestedHour = suggestBucraneHour(cards, clock);
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
        download("bucrane-courses.csv", bucraneCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveBucraneFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveBucraneFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addBucrane(cards, { title, note, hand, profile, hour: hourNo, bed, depth: depthNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-bucrane" aria-label={v4("bcrTitle")} data-bucrane="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-bucrane-mast">
        <p className="c4-bucrane-seal" data-logo="mono">{v4("bcrLogo")}</p>
        <div>
          <p className="c4-bucrane-kicker">{v4("bcrSub")}</p>
          <h2 className="c4-title">{v4("bcrTitle")}</h2>
        </div>
        <p className="c4-bucrane-count">{shown.length}</p>
      </header>
      <p className="c4-bucrane-links">
        <Link href={crmv4Href(base, "mnd")}>{v4("mndTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("bcrCustomers")}</Link>
      </p>
      <p className="c4-bucrane-hint">{v4("bcrHint")}</p>
      {viewer && <p className="c4-bucrane-note">{v4("bcrViewer")}</p>}
      <p className="c4-bucrane-meta">{v4("bcrFair")} {fair || "—"} · {v4("bcrBusy")} {busy || "—"} · {v4("bcrSuggest")} {profileLabel(v4, suggestedProfile)} · {bedLabel(v4, suggestedBed)} · {suggestedHour}</p>
      <ol className="c4-bucrane-index" aria-label={v4("bcrRemind")}>
        <li data-tone="gold">{v4("bcrOverdue")} {counts.overdue}</li>
        <li data-tone="pitch">{v4("bcrIdle")} {counts.idle}</li>
        <li data-tone="mist">{v4("bcrBrisk")} {counts.brisk}</li>
        <li data-tone="mist">{v4("bcrResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-bucrane-remind c4-bucrane-notices" role="status" aria-label={v4("bcrRemind")}>
          {reminders.map((name) => <li key={name}>{v4("bcrOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-bucrane-chart" aria-label={v4("bcrChart")}>
        {bars.map((bar) => (
          <button key={bar.profile} type="button" className="c4-bucrane-column" data-on={profileFilter === bar.profile ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === bar.profile ? "all" : bar.profile)}>
            <i style={{ width: `${Math.max(18, Math.round((bar.count / peak) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{profileLabel(v4, bar.profile)}</span>
          </button>
        ))}
      </div>
      <form className="c4-bucrane-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("bcrEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("bcrEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("bcrNote")}<input className="c4-field" aria-label={v4("bcrNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("bcrHand")}<input className="c4-field" aria-label={v4("bcrHand")} aria-required={false} value={hand} maxLength={24} disabled={viewer} onChange={(event) => setHand(event.target.value)} /></label>
        <label className="c4-lab">{v4("bcrProfile")}<select className="c4-field" aria-label={v4("bcrProfile")} value={profile} disabled={viewer} onChange={(event) => setProfile(event.target.value)}><option value="">{v4("bcrBlankProfile")}</option>{BCR_PROFILES.map((item) => <option key={item} value={item}>{profileLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("bcrBed")}<select className="c4-field" aria-label={v4("bcrBed")} value={bed} disabled={viewer} onChange={(event) => setBed(event.target.value)}><option value="">{v4("bcrAll")}</option>{BEDS.map((item) => <option key={item} value={item}>{bedLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("bcrHour")}<select className="c4-field" aria-label={v4("bcrHour")} value={hourNo} disabled={viewer} onChange={(event) => setHourNo(event.target.value)}><option value="">{v4("bcrAll")}</option>{HOURS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("bcrDepth")}<select className="c4-field" aria-label={v4("bcrDepth")} value={depthNo} disabled={viewer} onChange={(event) => setDepthNo(event.target.value)}><option value="">{v4("bcrAll")}</option>{DEPTHS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("bcrTag")}<input className="c4-field" aria-label={v4("bcrTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("bcrAdd")}</button>
      </form>
      <div className="c4-bucrane-tools">
        <input ref={searchRef} className="c4-field c4-bucrane-search" aria-label={v4("bcrSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("bcrSearch")} />
        {(["base", "press", "shelf"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={rack === item ? "1" : "0"} onClick={() => setRack(item)}>{v4(item === "base" ? "bcrYard" : item === "press" ? "bcrPress" : "bcrShelf")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={profileFilter === "warm" ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === "warm" ? "all" : "warm")}>{v4("bcrWarm")}</button>
        <button type="button" className="c4-chip" data-on={profileFilter === "cool" ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === "cool" ? "all" : "cool")}>{v4("bcrCool")}</button>
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
        <button type="button" className="c4-chip" data-on={sort === "hand" ? "1" : "0"} onClick={() => setSort(sort === "hand" ? "profile" : "hand")}>{sort === "hand" ? v4("bcrSortHand") : v4("bcrSortProfile")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "open" : "tight")}>{density === "tight" ? v4("bcrTight") : v4("bcrOpenDensity")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("bcrTimeline")}</button>
        <label className="c4-lab">{v4("bcrDesk")}<select className="c4-field" aria-label={v4("bcrDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{BCR_PROFILES.map((item) => <option key={item} value={item}>{profileLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-bucrane-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addBucraneView(views, { id, name: viewName, rack, query, hand: handFilter, bed: bedFilter, profile: profileFilter, hour: hourFilter, depth: depthFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("bcrViewName")}<input className="c4-field" aria-label={v4("bcrViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("bcrSaveView")}</button>
      </form>
      <ul className="c4-bucrane-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setRack(view.rack); setQuery(view.query); setHandFilter(view.hand); setBedFilter(view.bed); setProfileFilter(view.profile); setHourFilter(view.hour); setDepthFilter(view.depth); }}>{v4("bcrApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropBucraneView(views, view.id))}>{v4("bcrDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-bucrane-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkBucraneRaise(cards, picked))}>{v4("bcrBulkRaise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkBucraneShelf(cards, picked))}>{v4("bcrBulkArchive")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkBucraneLinen(cards, picked))}>{v4("bcrBulkLinen")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkBucraneTag(cards, picked))}>{v4("bcrBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("bucrane-courses.csv", bucraneCsv(shown, station))}>{v4("bcrCsv")}</button>
        <p className="c4-bucrane-meta">{v4("bcrKeys")} / c x a j k · {v4("bcrQuiet")} {counts.quiet} · {v4("bcrWarm")} {counts.warm}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-bucrane-time" aria-label={v4("bcrTimeline")}>
          {timeline.map((row) => <li key={row.hour}><span>{row.hour}</span> {row.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("bcrEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-bucrane-list">
          {shown.map((card) => {
            const late = lateBucrane(card, station);
            return (
              <li key={card.id} className="c4-bucrane-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleBucrane(card) ? "1" : "0"} data-brisk={briskBucrane(card) ? "1" : "0"} data-overdue={overdueBucrane(card) ? "1" : "0"} data-resting={restingBucrane(card) ? "1" : "0"} data-warm={profileWarm(card.profile) ? "1" : "0"} data-cool={profileCool(card.profile) ? "1" : "0"} data-quiet={ivoryQuiet(card.bed) ? "1" : "0"}>
                <label className="c4-bucrane-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editBucrane(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("bcrEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("bcrApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editBucraneNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("bcrNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-bucrane-meta">{profileLabel(v4, card.profile)} · {bedLabel(v4, card.bed)} · {card.hour ?? "—"} · {card.depth} · {card.hand || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "bcrAuditSave")}` : ""}{late ? ` · ${v4("bcrOverdue")}` : ""}</p>
                </div>
                <div className="c4-bucrane-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("bcrEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBucraneRaised(cards, card.id, !card.raised))}>{card.raised ? v4("bcrFree") : v4("bcrRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBucraneBed(cards, card.id, suggestedBed))}>{v4("bcrSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBucraneRack(cards, card.id, !card.pressed))}>{card.pressed ? v4("bcrUnpress") : v4("bcrPressIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBucraneShelf(cards, card.id, !card.shelved))}>{card.shelved ? v4("bcrUnshelf") : v4("bcrShelfIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBucranePin(cards, card.id, !card.pinned))}>{card.pinned ? v4("bcrUnpin") : v4("bcrPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addBucraneTag(cards, card.id, "r"))}>{v4("bcrTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHourFocused(cards, card.id))}>{v4("bcrRaiseHour")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHourFocused(cards, card.id))}>{v4("bcrLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseDepthFocused(cards, card.id))}>{v4("bcrDepth")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerDepthFocused(cards, card.id))}>{v4("bcrDepth")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bedFocused(cards, card.id))}>{v4("bcrBed")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBucraneFocused(cards, card.id))}>{v4("bcrRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(rackBucraneFocused(cards, card.id))}>{v4("bcrPress")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinBucraneFocused(cards, card.id))}>{v4("bcrPin")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(bucraneCopy(card))}>{v4("bcrCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type GroupUser = { id?: string; name?: string | null };

export function MeanderPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: GroupUser[] }>("/api/admin/users?take=24&meta=0");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<MeanderShape>("all");
  const [review, setReview] = useState<MeanderReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): MeanderRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      userId: id,
      code: meanderSlice(row),
    };
  }).filter((row): row is MeanderRow => Boolean(row));
  const present = presentMeanderLanes(rows);
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
    const next = readHiddenMeander(readJson(MND_HIDE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(MND_HIDE_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedMeander(readJson(MND_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(MND_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleMeanderLanes(present, hidden, showHidden);
  const shown = visibleMeander(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = meanderLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = meanderLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingMeander(rows);
  const leadHue = leadingMeanderHue(rows);
  const whole = rows.filter((row) => meanderLane(row.code)).length;
  const share = meanderShare(laneMeanderCount(rows, "live"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("meander-mark-lanes.csv", meanderLanesCsv(rows));
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
    writeJson(MND_HIDE_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(MND_REVIEW_KEY, next);
  }

  return (
    <section className="c4-meander" aria-label={v4("mndTitle")} data-meander="1" data-role={role} data-desk="1">
      <header className="c4-meander-mast">
        <p className="c4-meander-seal" data-logo="mono">{v4("mndLogo")}</p>
        <div>
          <p className="c4-meander-kicker">{v4("mndSub")}</p>
          <h2 className="c4-title">{v4("mndTitle")}</h2>
        </div>
        <p className="c4-meander-count">{shown.length}</p>
      </header>
      <p className="c4-meander-links">
        <Link href={crmv4Href(base, "bcr")}>{v4("bcrTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("mndCustomer")}</Link>
      </p>
      <p className="c4-meander-hint">{v4("mndHint")}</p>
      {viewer && <p className="c4-meander-note">{v4("mndViewer")}</p>}
      {queue.loading && <p className="c4-meander-meta">{v4("mndLoading")}</p>}
      {queue.error && <p className="c4-meander-meta">{v4("mndFailed")}</p>}
      <p className="c4-meander-meta">{v4("mndLead")} {laneLabel(v4, lead)} · {v4("mndToneLead")} {hueLabel(v4, leadHue)} · {v4("mndShare")} {share}</p>
      <div className="c4-meander-chart" aria-label={v4("mndChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-meander-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ width: `${Math.max(18, Math.round((line.count / peak) * 100))}%` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-meander-tools">
        <input ref={searchRef} className="c4-field c4-meander-search" aria-label={v4("mndSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("mndSearch")} />
        <label className="c4-lab">{v4("mndChart")}<select className="c4-field" aria-label={v4("mndChart")} value={shape} onChange={(event) => setShape(event.target.value as MeanderShape)}>{(Object.keys(SHAPE_KEY) as MeanderShape[]).map((item) => <option key={item} value={item}>{v4(SHAPE_KEY[item])}</option>)}</select></label>
        <button type="button" className="c4-chip" data-on={hue === "gilt" ? "1" : "0"} onClick={() => setHue(hue === "gilt" ? "all" : "gilt")}>{v4("mndGilt")}</button>
        <button type="button" className="c4-chip" data-on={hue === "pearl" ? "1" : "0"} onClick={() => setHue(hue === "pearl" ? "all" : "pearl")}>{v4("mndPearl")}</button>
        <button type="button" className="c4-chip" data-on={hue === "ash" ? "1" : "0"} onClick={() => setHue(hue === "ash" ? "all" : "ash")}>{v4("mndAsh")}</button>
        <button type="button" className="c4-chip" data-on={review === "fresh" ? "1" : "0"} onClick={() => setReview(review === "fresh" ? "all" : "fresh")}>{v4("mndFresh")}</button>
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview(review === "reviewed" ? "all" : "reviewed")}>{v4("mndReviewed")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{v4("mndShow")}</button>
        {present.map((lane) => (
          <button key={lane} type="button" className="c4-chip" data-on={hidden.includes(lane) ? "1" : "0"} onClick={() => storeHidden(toggleMeander(hidden, lane))}>{v4("mndHide")} {laneLabel(v4, lane)}</button>
        ))}
      </div>
      <div className="c4-meander-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkMeanderReview(reviewed, picked, true))}>{v4("mndBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkMeanderReview(reviewed, picked, false))}>{v4("mndBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("meander-marks.csv", meanderRowsCsv(shown, reviewed))}>{v4("mndRowCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("meander-mark-lanes.csv", meanderLanesCsv(rows))}>{v4("mndCsv")}</button>
      </div>
      {!shown.length && !queue.loading && <p className="c4-pay-empty">{v4("mndEmpty")}</p>}
      <ul className="c4-meander-list">
        {shown.map((row) => {
          const tone = meanderHue(row.code);
          const name = meanderCopy(row.code);
          return (
            <li key={row.id} className="c4-meander-card" data-mail={meanderLane(row.code) || "open"} data-hue={tone || "none"} data-lit={meanderLit(row.code) ? "1" : "0"} data-figure={meanderNear(row.code) ? "1" : "0"} data-short={meanderFar(row.code) ? "1" : "0"} data-long={meanderFade(row.code) ? "1" : "0"} data-dark={meanderDark(row.code) ? "1" : "0"} data-dim={meanderDim(row.code) ? "1" : "0"} data-blank={meanderBlank(row.code) ? "1" : "0"} data-open={meanderOpen(row.code) ? "1" : "0"} data-even={meanderEven(row.code) ? "1" : "0"} data-digit={meanderDigit(row.code) ? "1" : "0"} data-letter={meanderLetter(row.code) ? "1" : "0"} data-upper={meanderUpper(row.code) ? "1" : "0"}>
              <label className="c4-meander-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-meander-meta">{name || v4("mndOpen")} · {meanderStamp(row.code) || "—"} · {meanderLength(row.code) ?? "—"} · {laneLabel(v4, meanderLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-meander-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleMeanderReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("mndReviewed") : v4("mndReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { navigator.clipboard?.writeText(meanderCopy(row.code)); setCopied(row.id); }}>{copied === row.id ? v4("mndCopied") : v4("mndCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.userId || row.id}`)}>{v4("mndCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
