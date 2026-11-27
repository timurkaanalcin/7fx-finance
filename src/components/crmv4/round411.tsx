"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  PDV_HIDE_KEY,
  PDV_REVIEW_KEY,
  PRS_DENSITY_KEY,
  PRS_KEY,
  PRS_PROFILES,
  PRS_VIEW_KEY,
  addPeristasis,
  addPeristasisTag,
  addPeristasisView,
  bedFocused,
  briskPeristasis,
  bulkPendentiveReview,
  bulkPeristasisLinen,
  bulkPeristasisShelf,
  bulkPeristasisRaise,
  bulkPeristasisTag,
  busiestHand,
  dropPeristasisView,
  editPeristasis,
  editPeristasisNote,
  fairHand,
  pendentiveBlank,
  pendentiveCopy,
  pendentiveDigit,
  pendentiveEven,
  pendentiveFar,
  pendentiveHue,
  pendentiveLane,
  pendentiveLanes,
  pendentiveLanesCsv,
  pendentiveLength,
  pendentiveLetter,
  pendentiveDark,
  pendentiveDim,
  pendentiveFade,
  pendentiveLit,
  pendentiveOpen,
  pendentiveRowsCsv,
  pendentiveShare,
  pendentiveSlice,
  pendentiveStamp,
  pendentiveNear,
  pendentiveUpper,
  idlePeristasis,
  lanePendentiveCount,
  latePeristasis,
  leadingPendentive,
  leadingPendentiveHue,
  graphiteQuiet,
  lowerDepthFocused,
  lowerHourFocused,
  movePeristasisFocus,
  peristasisBars,
  peristasisCopy,
  peristasisCounts,
  peristasisCsv,
  peristasisDensity,
  peristasisHands,
  peristasisTimeline,
  overduePeristasis,
  pinPeristasisFocused,
  presentPendentiveLanes,
  profileCool,
  profileWarm,
  rackPeristasisFocused,
  raiseDepthFocused,
  raiseHourFocused,
  readHiddenPendentive,
  readReviewedPendentive,
  readPeristasisViews,
  readPeristasisList,
  reminderPeristasisList,
  restingPeristasis,
  setPeristasisFocused,
  setPeristasisBed,
  setPeristasisPin,
  setPeristasisRack,
  setPeristasisRaised,
  setPeristasisShelf,
  sortPeristasisList,
  suggestProfile,
  suggestPeristasisBed,
  suggestPeristasisHour,
  togglePendentive,
  togglePendentiveReview,
  visiblePendentive,
  visiblePendentiveLanes,
  visiblePeristasisList,
  type PendentiveReview,
  type PendentiveRow,
  type PendentiveShape,
  type Peristasis,
  type PeristasisDensity,
  type PeristasisRack,
  type PeristasisSort,
  type PeristasisView,
} from "@/lib/crmv4/round411";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const BEDS = ["IVORY", "GRAPHITE", "GILT"] as const;
const HOURS = ["2", "7", "11", "18"] as const;
const DEPTHS = ["4", "7", "11"] as const;

const PROFILE_KEY: Record<string, CrmV4CopyKey> = {
  peristasis: "psiPeristasis",
  surbase: "psiSurbase",
  femur: "psiFemur",
  mascaron: "psiMascaron",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "psiAuditSave",
  edit: "psiAuditEdit",
  note: "psiAuditNote",
  bed: "psiAuditBed",
  raise: "psiAuditRaise",
  free: "psiAuditFree",
  press: "psiAuditPress",
  return: "psiAuditReturn",
  shelf: "psiAuditShelf",
  open: "psiAuditOpen",
  tag: "psiAuditTag",
  depth: "psiAuditDepth",
  hour: "psiAuditHour",
  lower: "psiAuditLower",
  pin: "psiAuditPin",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  live: "pdnLaneLive",
  code: "pdnLaneCode",
  short: "pdnLaneShort",
  long: "pdnLaneLong",
  hold: "pdnLaneHold",
  shut: "pdnLaneShut",
  blank: "pdnLaneBlank",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  gilt: "pdnGilt",
  pearl: "pdnPearl",
  ash: "pdnAsh",
};

const SHAPE_KEY: Record<PendentiveShape, CrmV4CopyKey> = {
  all: "pdnShapeAll",
  live: "pdnShapeLive",
  code: "pdnShapeCode",
  short: "pdnShapeShort",
  long: "pdnShapeLong",
  hold: "pdnShapeHold",
  shut: "pdnShapeShut",
  blank: "pdnShapeBlank",
  open: "pdnShapeOpen",
  digit: "pdnShapeDigit",
  letter: "pdnShapeLetter",
  even: "pdnShapeEven",
  upper: "pdnShapeUpper",
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
  return key ? v4(key) : v4("psiBlankProfile");
}

function bedLabel(v4: V4, bed: string): string {
  if (bed === "IVORY") return v4("psiLinen");
  if (bed === "GRAPHITE") return v4("psiSlate");
  if (bed === "GILT") return v4("psiGilt");
  return v4("psiAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("pdnBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("pdnBlank");
}

export function PeristasisCourses({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Peristasis[]>([]);
  const [views, setViews] = useState<PeristasisView[]>([]);
  const [density, setDensity] = useState<PeristasisDensity>("open");
  const [rack, setRack] = useState<PeristasisRack>("base");
  const [query, setQuery] = useState("");
  const [handFilter, setHandFilter] = useState("");
  const [bedFilter, setBedFilter] = useState("all");
  const [profileFilter, setProfileFilter] = useState("all");
  const [hourFilter, setHourFilter] = useState("all");
  const [depthFilter, setDepthFilter] = useState("all");
  const [sort, setSort] = useState<PeristasisSort>("profile");
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
  const [station, setStation] = useState("peristasis");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readPeristasisList(readJson(PRS_KEY, [])));
    setViews(readPeristasisViews(readJson(PRS_VIEW_KEY, [])));
    setDensity(peristasisDensity(readJson(PRS_DENSITY_KEY, "open")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Peristasis[]) {
    setCards(next);
    writeJson(PRS_KEY, next);
  }
  function storeViews(next: PeristasisView[]) {
    setViews(next);
    writeJson(PRS_VIEW_KEY, next);
  }
  function storeDensity(next: PeristasisDensity) {
    setDensity(next);
    writeJson(PRS_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortPeristasisList(visiblePeristasisList(cards, rack, query, handFilter, bedFilter, profileFilter, hourFilter, depthFilter), sort),
    [cards, rack, query, handFilter, bedFilter, profileFilter, hourFilter, depthFilter, sort],
  );
  const counts = peristasisCounts(cards, shown, station);
  const bars = peristasisBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = peristasisTimeline(cards);
  const reminders = reminderPeristasisList(cards);
  const hands = peristasisHands(cards);
  const busy = busiestHand(cards);
  const fair = fairHand(cards, hands.join(","));
  const suggestedBed = suggestPeristasisBed(cards);
  const suggestedHour = suggestPeristasisHour(cards, clock);
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
        download("peristasis-courses.csv", peristasisCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => movePeristasisFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => movePeristasisFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addPeristasis(cards, { title, note, hand, profile, hour: hourNo, bed, depth: depthNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-peristasis" aria-label={v4("psiTitle")} data-peristasis="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-peristasis-mast">
        <p className="c4-peristasis-seal" data-logo="mono">{v4("psiLogo")}</p>
        <div>
          <p className="c4-peristasis-kicker">{v4("psiSub")}</p>
          <h2 className="c4-title">{v4("psiTitle")}</h2>
        </div>
        <p className="c4-peristasis-count">{shown.length}</p>
      </header>
      <p className="c4-peristasis-links">
        <Link href={crmv4Href(base, "pdv")}>{v4("pdnTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("psiCustomers")}</Link>
      </p>
      <p className="c4-peristasis-hint">{v4("psiHint")}</p>
      {viewer && <p className="c4-peristasis-note">{v4("psiViewer")}</p>}
      <p className="c4-peristasis-meta">{v4("psiFair")} {fair || "—"} · {v4("psiBusy")} {busy || "—"} · {v4("psiSuggest")} {profileLabel(v4, suggestedProfile)} · {bedLabel(v4, suggestedBed)} · {suggestedHour}</p>
      <ol className="c4-peristasis-index" aria-label={v4("psiRemind")}>
        <li data-tone="gold">{v4("psiOverdue")} {counts.overdue}</li>
        <li data-tone="pitch">{v4("psiIdle")} {counts.idle}</li>
        <li data-tone="mist">{v4("psiBrisk")} {counts.brisk}</li>
        <li data-tone="mist">{v4("psiResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-peristasis-remind c4-peristasis-notices" role="status" aria-label={v4("psiRemind")}>
          {reminders.map((name) => <li key={name}>{v4("psiOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-peristasis-chart" aria-label={v4("psiChart")}>
        {bars.map((bar) => (
          <button key={bar.profile} type="button" className="c4-peristasis-column" data-on={profileFilter === bar.profile ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === bar.profile ? "all" : bar.profile)}>
            <i style={{ width: `${Math.max(18, Math.round((bar.count / peak) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{profileLabel(v4, bar.profile)}</span>
          </button>
        ))}
      </div>
      <form className="c4-peristasis-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("psiEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("psiEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("psiNote")}<input className="c4-field" aria-label={v4("psiNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("psiHand")}<input className="c4-field" aria-label={v4("psiHand")} aria-required={false} value={hand} maxLength={24} disabled={viewer} onChange={(event) => setHand(event.target.value)} /></label>
        <label className="c4-lab">{v4("psiProfile")}<select className="c4-field" aria-label={v4("psiProfile")} value={profile} disabled={viewer} onChange={(event) => setProfile(event.target.value)}><option value="">{v4("psiBlankProfile")}</option>{PRS_PROFILES.map((item) => <option key={item} value={item}>{profileLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("psiBed")}<select className="c4-field" aria-label={v4("psiBed")} value={bed} disabled={viewer} onChange={(event) => setBed(event.target.value)}><option value="">{v4("psiAll")}</option>{BEDS.map((item) => <option key={item} value={item}>{bedLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("psiHour")}<select className="c4-field" aria-label={v4("psiHour")} value={hourNo} disabled={viewer} onChange={(event) => setHourNo(event.target.value)}><option value="">{v4("psiAll")}</option>{HOURS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("psiDepth")}<select className="c4-field" aria-label={v4("psiDepth")} value={depthNo} disabled={viewer} onChange={(event) => setDepthNo(event.target.value)}><option value="">{v4("psiAll")}</option>{DEPTHS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("psiTag")}<input className="c4-field" aria-label={v4("psiTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("psiAdd")}</button>
      </form>
      <div className="c4-peristasis-tools">
        <input ref={searchRef} className="c4-field c4-peristasis-search" aria-label={v4("psiSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("psiSearch")} />
        {(["base", "press", "shelf"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={rack === item ? "1" : "0"} onClick={() => setRack(item)}>{v4(item === "base" ? "psiYard" : item === "press" ? "psiPress" : "psiShelf")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={profileFilter === "warm" ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === "warm" ? "all" : "warm")}>{v4("psiWarm")}</button>
        <button type="button" className="c4-chip" data-on={profileFilter === "cool" ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === "cool" ? "all" : "cool")}>{v4("psiCool")}</button>
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
        <button type="button" className="c4-chip" data-on={sort === "hand" ? "1" : "0"} onClick={() => setSort(sort === "hand" ? "profile" : "hand")}>{sort === "hand" ? v4("psiSortHand") : v4("psiSortProfile")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "open" : "tight")}>{density === "tight" ? v4("psiTight") : v4("psiOpenDensity")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("psiTimeline")}</button>
        <label className="c4-lab">{v4("psiDesk")}<select className="c4-field" aria-label={v4("psiDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{PRS_PROFILES.map((item) => <option key={item} value={item}>{profileLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-peristasis-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addPeristasisView(views, { id, name: viewName, rack, query, hand: handFilter, bed: bedFilter, profile: profileFilter, hour: hourFilter, depth: depthFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("psiViewName")}<input className="c4-field" aria-label={v4("psiViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("psiSaveView")}</button>
      </form>
      <ul className="c4-peristasis-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setRack(view.rack); setQuery(view.query); setHandFilter(view.hand); setBedFilter(view.bed); setProfileFilter(view.profile); setHourFilter(view.hour); setDepthFilter(view.depth); }}>{v4("psiApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropPeristasisView(views, view.id))}>{v4("psiDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-peristasis-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkPeristasisRaise(cards, picked))}>{v4("psiBulkRaise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkPeristasisShelf(cards, picked))}>{v4("psiBulkArchive")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkPeristasisLinen(cards, picked))}>{v4("psiBulkLinen")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkPeristasisTag(cards, picked))}>{v4("psiBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("peristasis-courses.csv", peristasisCsv(shown, station))}>{v4("psiCsv")}</button>
        <p className="c4-peristasis-meta">{v4("psiKeys")} / c x a j k · {v4("psiQuiet")} {counts.quiet} · {v4("psiWarm")} {counts.warm}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-peristasis-time" aria-label={v4("psiTimeline")}>
          {timeline.map((row) => <li key={row.hour}><span>{row.hour}</span> {row.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("psiEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-peristasis-list">
          {shown.map((card) => {
            const late = latePeristasis(card, station);
            return (
              <li key={card.id} className="c4-peristasis-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idlePeristasis(card) ? "1" : "0"} data-brisk={briskPeristasis(card) ? "1" : "0"} data-overdue={overduePeristasis(card) ? "1" : "0"} data-resting={restingPeristasis(card) ? "1" : "0"} data-warm={profileWarm(card.profile) ? "1" : "0"} data-cool={profileCool(card.profile) ? "1" : "0"} data-quiet={graphiteQuiet(card.bed) ? "1" : "0"}>
                <label className="c4-peristasis-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editPeristasis(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("psiEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("psiApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editPeristasisNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("psiNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-peristasis-meta">{profileLabel(v4, card.profile)} · {bedLabel(v4, card.bed)} · {card.hour ?? "—"} · {card.depth} · {card.hand || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "psiAuditSave")}` : ""}{late ? ` · ${v4("psiOverdue")}` : ""}</p>
                </div>
                <div className="c4-peristasis-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("psiEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setPeristasisRaised(cards, card.id, !card.raised))}>{card.raised ? v4("psiFree") : v4("psiRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setPeristasisBed(cards, card.id, suggestedBed))}>{v4("psiSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setPeristasisRack(cards, card.id, !card.pressed))}>{card.pressed ? v4("psiUnpress") : v4("psiPressIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setPeristasisShelf(cards, card.id, !card.shelved))}>{card.shelved ? v4("psiUnshelf") : v4("psiShelfIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setPeristasisPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("psiUnpin") : v4("psiPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addPeristasisTag(cards, card.id, "a"))}>{v4("psiTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHourFocused(cards, card.id))}>{v4("psiRaiseHour")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHourFocused(cards, card.id))}>{v4("psiLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseDepthFocused(cards, card.id))}>{v4("psiDepth")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerDepthFocused(cards, card.id))}>{v4("psiDepth")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bedFocused(cards, card.id))}>{v4("psiBed")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setPeristasisFocused(cards, card.id))}>{v4("psiRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(rackPeristasisFocused(cards, card.id))}>{v4("psiPress")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinPeristasisFocused(cards, card.id))}>{v4("psiPin")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(peristasisCopy(card))}>{v4("psiCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type GroupUser = { id?: string; name?: string | null; validationStatus?: unknown };

export function PendentivePlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: GroupUser[] }>("/api/admin/users?take=24&meta=0");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<PendentiveShape>("all");
  const [review, setReview] = useState<PendentiveReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): PendentiveRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      userId: id,
      code: pendentiveSlice(row),
    };
  }).filter((row): row is PendentiveRow => Boolean(row));
  const present = presentPendentiveLanes(rows);
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
    const next = readHiddenPendentive(readJson(PDV_HIDE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(PDV_HIDE_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedPendentive(readJson(PDV_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(PDV_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visiblePendentiveLanes(present, hidden, showHidden);
  const shown = visiblePendentive(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = pendentiveLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = pendentiveLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingPendentive(rows);
  const leadHue = leadingPendentiveHue(rows);
  const whole = rows.filter((row) => pendentiveLane(row.code)).length;
  const share = pendentiveShare(lanePendentiveCount(rows, "live"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("pendentive-validation-lanes.csv", pendentiveLanesCsv(rows));
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
    writeJson(PDV_HIDE_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(PDV_REVIEW_KEY, next);
  }

  return (
    <section className="c4-pendentive" aria-label={v4("pdnTitle")} data-pendentive="1" data-role={role} data-validation="1">
      <header className="c4-pendentive-mast">
        <p className="c4-pendentive-seal" data-logo="mono">{v4("pdnLogo")}</p>
        <div>
          <p className="c4-pendentive-kicker">{v4("pdnSub")}</p>
          <h2 className="c4-title">{v4("pdnTitle")}</h2>
        </div>
        <p className="c4-pendentive-count">{shown.length}</p>
      </header>
      <p className="c4-pendentive-links">
        <Link href={crmv4Href(base, "prs")}>{v4("psiTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("pdnCustomer")}</Link>
      </p>
      <p className="c4-pendentive-hint">{v4("pdnHint")}</p>
      {viewer && <p className="c4-pendentive-note">{v4("pdnViewer")}</p>}
      {queue.loading && <p className="c4-pendentive-meta">{v4("pdnLoading")}</p>}
      {queue.error && <p className="c4-pendentive-meta">{v4("pdnFailed")}</p>}
      <p className="c4-pendentive-meta">{v4("pdnLead")} {laneLabel(v4, lead)} · {v4("pdnToneLead")} {hueLabel(v4, leadHue)} · {v4("pdnShare")} {share}</p>
      <div className="c4-pendentive-chart" aria-label={v4("pdnChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-pendentive-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ width: `${Math.max(18, Math.round((line.count / peak) * 100))}%` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-pendentive-tools">
        <input ref={searchRef} className="c4-field c4-pendentive-search" aria-label={v4("pdnSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("pdnSearch")} />
        <label className="c4-lab">{v4("pdnChart")}<select className="c4-field" aria-label={v4("pdnChart")} value={shape} onChange={(event) => setShape(event.target.value as PendentiveShape)}>{(Object.keys(SHAPE_KEY) as PendentiveShape[]).map((item) => <option key={item} value={item}>{v4(SHAPE_KEY[item])}</option>)}</select></label>
        <button type="button" className="c4-chip" data-on={hue === "gilt" ? "1" : "0"} onClick={() => setHue(hue === "gilt" ? "all" : "gilt")}>{v4("pdnGilt")}</button>
        <button type="button" className="c4-chip" data-on={hue === "pearl" ? "1" : "0"} onClick={() => setHue(hue === "pearl" ? "all" : "pearl")}>{v4("pdnPearl")}</button>
        <button type="button" className="c4-chip" data-on={hue === "ash" ? "1" : "0"} onClick={() => setHue(hue === "ash" ? "all" : "ash")}>{v4("pdnAsh")}</button>
        <button type="button" className="c4-chip" data-on={review === "fresh" ? "1" : "0"} onClick={() => setReview(review === "fresh" ? "all" : "fresh")}>{v4("pdnFresh")}</button>
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview(review === "reviewed" ? "all" : "reviewed")}>{v4("pdnReviewed")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{v4("pdnShow")}</button>
        {present.map((lane) => (
          <button key={lane} type="button" className="c4-chip" data-on={hidden.includes(lane) ? "1" : "0"} onClick={() => storeHidden(togglePendentive(hidden, lane))}>{v4("pdnHide")} {laneLabel(v4, lane)}</button>
        ))}
      </div>
      <div className="c4-pendentive-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkPendentiveReview(reviewed, picked, true))}>{v4("pdnBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkPendentiveReview(reviewed, picked, false))}>{v4("pdnBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("pendentive-validation-rows.csv", pendentiveRowsCsv(shown, reviewed))}>{v4("pdnRowCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("pendentive-validation-marks.csv", pendentiveLanesCsv(rows))}>{v4("pdnCsv")}</button>
      </div>
      {!shown.length && !queue.loading && <p className="c4-pay-empty">{v4("pdnEmpty")}</p>}
      <ul className="c4-pendentive-list">
        {shown.map((row) => {
          const tone = pendentiveHue(row.code);
          const name = pendentiveCopy(row.code);
          return (
            <li key={row.id} className="c4-pendentive-card" data-mail={pendentiveLane(row.code) || "open"} data-hue={tone || "none"} data-lit={pendentiveLit(row.code) ? "1" : "0"} data-figure={pendentiveNear(row.code) ? "1" : "0"} data-short={pendentiveFar(row.code) ? "1" : "0"} data-long={pendentiveFade(row.code) ? "1" : "0"} data-dark={pendentiveDark(row.code) ? "1" : "0"} data-dim={pendentiveDim(row.code) ? "1" : "0"} data-blank={pendentiveBlank(row.code) ? "1" : "0"} data-open={pendentiveOpen(row.code) ? "1" : "0"} data-even={pendentiveEven(row.code) ? "1" : "0"} data-digit={pendentiveDigit(row.code) ? "1" : "0"} data-letter={pendentiveLetter(row.code) ? "1" : "0"} data-upper={pendentiveUpper(row.code) ? "1" : "0"}>
              <label className="c4-pendentive-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-pendentive-meta">{name || v4("pdnOpen")} · {pendentiveStamp(row.code) || "—"} · {pendentiveLength(row.code) ?? "—"} · {laneLabel(v4, pendentiveLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-pendentive-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(togglePendentiveReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("pdnReviewed") : v4("pdnReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { navigator.clipboard?.writeText(pendentiveCopy(row.code)); setCopied(row.id); }}>{copied === row.id ? v4("pdnCopied") : v4("pdnCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.userId || row.id}`)}>{v4("pdnCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
