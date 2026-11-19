"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  DIOPTRA_BEARINGS,
  DPT_DENSITY_KEY,
  DPT_KEY,
  DPT_VIEW_KEY,
  EML_KEY,
  EML_REVIEW_KEY,
  addDioptra,
  addDioptraTag,
  addDioptraView,
  alignDioptraFocused,
  briskDioptra,
  bulkDioptraAlign,
  bulkDioptraBronze,
  bulkDioptraTag,
  bulkDioptraVault,
  bulkEmailReview,
  busiestDioptraSurveyor,
  caseDioptraFocused,
  cycleFinish,
  dioptraBars,
  dioptraCopy,
  dioptraCounts,
  dioptraCsv,
  dioptraDensity,
  dioptraSurveyors,
  dioptraTimeline,
  dropDioptraView,
  editDioptra,
  editDioptraNote,
  emailAlias,
  emailCopy,
  emailDigit,
  emailDomain,
  emailEven,
  emailFirst,
  emailHeld,
  emailHouse,
  emailHue,
  emailLane,
  emailLanes,
  emailLanesCsv,
  emailLength,
  emailLetter,
  emailLower,
  emailMark,
  emailMixed,
  emailNest,
  emailOpen,
  emailPlus,
  emailRowsCsv,
  emailShare,
  emailSoon,
  emailSpace,
  emailSpark,
  emailStamp,
  emailTail,
  emailUpper,
  emailVowel,
  emailWork,
  fairDioptraSurveyor,
  finishFocused,
  idleDioptra,
  innerBearing,
  laneEmailCount,
  lateDioptra,
  leadingEmail,
  leadingEmailHue,
  liftAltitudeFocused,
  lowerAltitudeFocused,
  lowerVaneFocused,
  moveDioptraFocus,
  outerBearing,
  overdueDioptra,
  presentEmailLanes,
  raiseVaneFocused,
  readDioptraViews,
  readDioptras,
  readHiddenEmail,
  readReviewedEmail,
  reminderDioptras,
  restingDioptra,
  setDioptraAligned,
  setDioptraCase,
  setDioptraFinish,
  setDioptraStar,
  setDioptraVault,
  sortDioptras,
  starDioptraFocused,
  suggestAltitude,
  suggestBearing,
  suggestDioptraFinish,
  tagDioptraFocused,
  toggleEmail,
  toggleEmailReview,
  visibleDioptras,
  visibleEmail,
  visibleEmailLanes,
  type Dioptra,
  type DioptraDensity,
  type DioptraSort,
  type DioptraTray,
  type DioptraView,
  type EmailReview,
  type EmailRow,
  type EmailShape,
  type EmailValue,
} from "@/lib/crmv4/round297";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const FINISHES = ["CHALK", "INK", "BRONZE"] as const;
const ALTITUDES = ["15", "30", "45", "60"] as const;
const VANES = ["1", "3", "5"] as const;
const BEARING_KEY: Record<string, CrmV4CopyKey> = {
  north: "dptNorth",
  east: "dptEast",
  south: "dptSouth",
  west: "dptWest",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "dptAuditSave",
  edit: "dptAuditEdit",
  note: "dptAuditNote",
  finish: "dptAuditFinish",
  align: "dptAuditAlign",
  clear: "dptAuditClear",
  case: "dptAuditCase",
  resume: "dptAuditResume",
  vault: "dptAuditVault",
  open: "dptAuditOpen",
  tag: "dptAuditTag",
  vane: "dptAuditVane",
  altitude: "dptAuditAltitude",
  lower: "dptAuditLower",
  star: "dptAuditStar",
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

function bearingLabel(v4: V4, bearing: string): string {
  const key = BEARING_KEY[bearing];
  return key ? v4(key) : v4("dptBlankBearing");
}

function finishLabel(v4: V4, finish: string): string {
  if (finish === "CHALK") return v4("dptChalk");
  if (finish === "INK") return v4("dptInk");
  if (finish === "BRONZE") return v4("dptBronze");
  return v4("dptAll");
}

export function DioptraSights({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Dioptra[]>([]);
  const [views, setViews] = useState<DioptraView[]>([]);
  const [density, setDensity] = useState<DioptraDensity>("wide");
  const [tray, setTray] = useState<DioptraTray>("bench");
  const [query, setQuery] = useState("");
  const [surveyorFilter, setSurveyorFilter] = useState("");
  const [finishFilter, setFinishFilter] = useState("all");
  const [bearingFilter, setBearingFilter] = useState("all");
  const [altitudeFilter, setAltitudeFilter] = useState("all");
  const [vaneFilter, setVaneFilter] = useState("all");
  const [sort, setSort] = useState<DioptraSort>("bearing");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [surveyor, setSurveyor] = useState("");
  const [bearing, setBearing] = useState("");
  const [finish, setFinish] = useState("");
  const [altitudeNo, setAltitudeNo] = useState("");
  const [vaneNo, setVaneNo] = useState("");
  const [tags, setTags] = useState("");
  const [viewName, setViewName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focusAt, setFocusAt] = useState(0);
  const [desk, setDesk] = useState("north");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readDioptras(readJson(DPT_KEY, [])));
    setViews(readDioptraViews(readJson(DPT_VIEW_KEY, [])));
    setDensity(dioptraDensity(readJson(DPT_DENSITY_KEY, "wide")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Dioptra[]) {
    setCards(next);
    writeJson(DPT_KEY, next);
  }
  function storeViews(next: DioptraView[]) {
    setViews(next);
    writeJson(DPT_VIEW_KEY, next);
  }
  function storeDensity(next: DioptraDensity) {
    setDensity(next);
    writeJson(DPT_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortDioptras(visibleDioptras(cards, tray, query, surveyorFilter, finishFilter, bearingFilter, altitudeFilter, vaneFilter), sort),
    [cards, tray, query, surveyorFilter, finishFilter, bearingFilter, altitudeFilter, vaneFilter, sort],
  );
  const counts = dioptraCounts(cards, shown, desk);
  const bars = dioptraBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = dioptraTimeline(cards);
  const surveyors = dioptraSurveyors(cards);
  const ids = shown.map((card) => card.id);
  const suggested = suggestDioptraFinish(cards);
  const fair = fairDioptraSurveyor(cards, surveyors.join(","));
  const busy = busiestDioptraSurveyor(cards);
  const reminders = reminderDioptras(cards);
  const altitudeHint = suggestAltitude(cards, clock);
  const bearingHint = suggestBearing(clock);
  const focused = shown[focusAt];

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setTitle("");
        setNote("");
        setSurveyor("");
        setBearing("");
        setFinish("");
        setAltitudeNo("");
        setVaneNo("");
        setTags("");
        return;
      }
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocusAt((index) => moveDioptraFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocusAt((index) => moveDioptraFocus(index, shown.length, -1));
        return;
      }
      if (viewer) return;
      const id = shown[focusAt]?.id || "";
      if (event.key === "q" || event.key === "Q") {
        event.preventDefault();
        store(liftAltitudeFocused(cards, id));
        return;
      }
      if (event.key === "v" || event.key === "V") {
        event.preventDefault();
        store(setDioptraVault(cards, id, !shown[focusAt]?.vaulted));
        return;
      }
      if (event.key === "g" || event.key === "G") {
        event.preventDefault();
        store(finishFocused(cards, id));
        return;
      }
      if (event.key === "l" || event.key === "L") {
        event.preventDefault();
        store(caseDioptraFocused(cards, id));
        return;
      }
      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        store(alignDioptraFocused(cards, id));
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("dioptra-sights.csv", dioptraCsv(shown, desk));
        return;
      }
      if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        store(starDioptraFocused(cards, id));
        return;
      }
      if (event.key === "u" || event.key === "U") {
        event.preventDefault();
        store(raiseVaneFocused(cards, id));
        return;
      }
      if (event.key === "y" || event.key === "Y") {
        event.preventDefault();
        store(lowerVaneFocused(cards, id));
        return;
      }
      if (event.key === "f" || event.key === "F") {
        event.preventDefault();
        store(lowerAltitudeFocused(cards, id));
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
    <section className="c4-dioptra" aria-label={v4("dptTitle")} data-cards="1" data-desk={tray} data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-dioptra-mast">
        <p className="c4-dioptra-seal" data-logo="mono">{v4("dptLogo")}</p>
        <div>
          <p className="c4-dioptra-kicker">{v4("dptSub")}</p>
          <h2 className="c4-title">{v4("dptTitle")}</h2>
        </div>
        <ol className="c4-dioptra-index" aria-label={v4("dptTitle")}>
          <li data-tone="gold">{v4("dptBronze")}</li>
          <li data-tone="ink">{v4("dptInk")}</li>
          <li data-tone="ivory">{v4("dptChalk")}</li>
        </ol>
      </header>
      <p className="c4-dioptra-links">
        <Link href={crmv4Href(base, "eml")}>{v4("emlTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("dptCustomers")}</Link>
        <Link href={crmv4Href(base, "sideglance")}>{v4("sdCloisterKicker")}</Link>
        <Link href={crmv4Href(base, "licglance")}>{v4("lcCourtKicker")}</Link>
      </p>
      <p className="c4-dioptra-hint">{v4("dptHint")}</p>
      {viewer && <p className="c4-dioptra-note">{v4("dptViewer")}</p>}
      {counts.overdue > 0 && <p className="c4-dioptra-notice" role="status">{v4("dptOverdue")} {counts.overdue}</p>}
      <ol className="c4-dioptra-dials" aria-label={v4("dptChart")}>
        <li><span>{v4("dptBench")}</span><strong>{counts.bench}</strong></li>
        <li><span>{v4("dptCase")}</span><strong>{counts.case}</strong></li>
        <li><span>{v4("dptVault")}</span><strong>{counts.vault}</strong></li>
        <li><span>{v4("dptOverdue")}</span><strong>{counts.overdue}</strong></li>
        <li><span>{v4("dptIdle")}</span><strong>{counts.idle}</strong></li>
        <li><span>{v4("dptBrisk")}</span><strong>{counts.brisk}</strong></li>
        <li><span>{v4("dptFair")}</span><strong>{fair || "·"}</strong></li>
        <li><span>{v4("dptBusy")}</span><strong>{busy || "·"}</strong></li>
      </ol>
      <div className="c4-dioptra-chart" aria-label={v4("dptChart")}>
        {bars.map((bar) => (
          <button key={bar.bearing} type="button" className="c4-dioptra-column" data-on={bearingFilter === bar.bearing ? "1" : "0"} data-bearing={bar.bearing} onClick={() => setBearingFilter(bearingFilter === bar.bearing ? "all" : bar.bearing)}>
            <i style={{ height: `${Math.max(8, Math.round((bar.count / peak) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{bearingLabel(v4, bar.bearing)}</span>
          </button>
        ))}
      </div>
      <div className="c4-dioptra-tools">
        <input ref={searchRef} className="c4-field c4-dioptra-search" aria-label={v4("dptSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("dptSearch")} />
        <select className="c4-select" aria-label={v4("dptSurveyor")} value={surveyorFilter} onChange={(event) => setSurveyorFilter(event.target.value)}>
          <option value="">{v4("dptSurveyor")}</option>
          {surveyors.map((name) => <option key={name} value={name}>{name}</option>)}
        </select>
        {(["bench", "case", "vault"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "bench" ? "dptBench" : item === "case" ? "dptCase" : "dptVault")}</button>
        ))}
        {(["all", "inner", "outer", ...DIOPTRA_BEARINGS] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={bearingFilter === item ? "1" : "0"} onClick={() => setBearingFilter(item)}>{item === "all" ? v4("dptAll") : item === "inner" ? v4("dptInner") : item === "outer" ? v4("dptOuter") : bearingLabel(v4, item)}</button>
        ))}
        {["all", ...FINISHES].map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={finishFilter === item ? "1" : "0"} onClick={() => setFinishFilter(item)}>{item === "all" ? v4("dptFinish") : finishLabel(v4, item)}</button>
        ))}
        {["all", ...ALTITUDES].map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={altitudeFilter === item ? "1" : "0"} onClick={() => setAltitudeFilter(item)}>{item === "all" ? v4("dptAltitude") : item}</button>
        ))}
        {["all", ...VANES].map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={vaneFilter === item ? "1" : "0"} onClick={() => setVaneFilter(item)}>{item === "all" ? v4("dptVane") : item}</button>
        ))}
        <button type="button" className="c4-chip" data-on={sort === "surveyor" ? "1" : "0"} onClick={() => setSort(sort === "bearing" ? "surveyor" : "bearing")}>{sort === "bearing" ? v4("dptSortBearing") : v4("dptSortSurveyor")}</button>
        <button type="button" className="c4-chip" data-on={density === "narrow" ? "1" : "0"} onClick={() => storeDensity(density === "wide" ? "narrow" : "wide")}>{density === "wide" ? v4("dptWide") : v4("dptNarrow")}</button>
        <button type="button" className="c4-btn" onClick={() => download("dioptra-sights.csv", dioptraCsv(shown, desk))}>{v4("dptCsv")}</button>
      </div>
      <div className="c4-dioptra-tools" role="group" aria-label={v4("dptDesk")}>
        {DIOPTRA_BEARINGS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={desk === item ? "1" : "0"} onClick={() => setDesk(item)}>{v4("dptDesk")} {bearingLabel(v4, item)}</button>
        ))}
        <span className="c4-dioptra-meta">{v4("dptSuggest")} {finishLabel(v4, suggested)} · {altitudeHint} · {bearingLabel(v4, bearingHint)}</span>
      </div>
      <form className="c4-dioptra-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addDioptra(cards, { title, note, surveyor, bearing, finish: finish || suggested, altitude: altitudeNo, vane: vaneNo, tags });
        if (next.length === cards.length) return;
        store(next);
        setTitle("");
        setNote("");
        setTags("");
      }}>
        <input className="c4-field" aria-label={v4("dptEdit")} aria-required={false} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} placeholder={v4("dptTitle")} />
        <input className="c4-field" aria-label={v4("dptNote")} aria-required={false} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} placeholder={v4("dptNote")} />
        <input className="c4-field" aria-label={v4("dptSurveyor")} aria-required={false} value={surveyor} disabled={viewer} onChange={(event) => setSurveyor(event.target.value)} placeholder={v4("dptSurveyor")} />
        <select className="c4-select" aria-label={v4("dptDesk")} value={bearing} disabled={viewer} onChange={(event) => setBearing(event.target.value)}>
          <option value="">{v4("dptBlankBearing")}</option>
          {DIOPTRA_BEARINGS.map((item) => <option key={item} value={item}>{bearingLabel(v4, item)}</option>)}
        </select>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("dptAdd")}</button>
      </form>
      <form className="c4-dioptra-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addDioptraView(views, { id: `v${Date.now().toString(36)}`, name: viewName, tray, query, surveyor: surveyorFilter, finish: finishFilter, bearing: bearingFilter, altitude: altitudeFilter, vane: vaneFilter });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <input className="c4-field" aria-label={v4("dptViewName")} aria-required={false} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} placeholder={v4("dptViewName")} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("dptSaveView")}</button>
      </form>
      <ul className="c4-dioptra-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setSurveyorFilter(view.surveyor); setFinishFilter(view.finish); setBearingFilter(view.bearing); setAltitudeFilter(view.altitude); setVaneFilter(view.vane); }}>{v4("dptApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropDioptraView(views, view.id))}>{v4("dptDrop")}</button>
          </li>
        ))}
      </ul>
      {picked.length > 0 && (
        <div className="c4-dioptra-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkDioptraBronze(cards, picked))}>{v4("dptBulkBronze")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkDioptraAlign(cards, picked))}>{v4("dptBulkAlign")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkDioptraVault(cards, picked))}>{v4("dptBulkVault")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkDioptraTag(cards, picked))}>{v4("dptBulkTag")}</button>
        </div>
      )}
      <p className="c4-dioptra-meta">{v4("dptKeys")} · j k n l g v s f q u y x /</p>
      {timeline.length > 0 && (
        <ol className="c4-dioptra-time" aria-label={v4("dptTimeline")}>
          {timeline.map((lane) => (
            <li key={lane.altitude}><span>{v4("dptAltitude")} {lane.altitude}</span><strong>{lane.titles.join(" · ")}</strong></li>
          ))}
        </ol>
      )}
      {reminders.length > 0 && <p className="c4-dioptra-meta">{v4("dptRemind")} {reminders.join(" · ")}</p>}
      {!shown.length && <p className="c4-dioptra-empty">{v4("dptEmpty")}</p>}
      <ol className="c4-dioptra-board">
        {shown.map((card, index) => {
          const on = index === focusAt;
          return (
            <li key={card.id} className="c4-dioptra-card" data-on={on ? "1" : "0"} data-overdue={overdueDioptra(card) ? "1" : "0"} data-idle={idleDioptra(card) ? "1" : "0"} data-brisk={briskDioptra(card) ? "1" : "0"} data-resting={restingDioptra(card) ? "1" : "0"} data-late={lateDioptra(card, desk) ? "1" : "0"} data-outer={outerBearing(card.bearing) ? "1" : "0"} data-inner={innerBearing(card.bearing) ? "1" : "0"} data-star={card.flagged ? "1" : "0"}>
              <label className="c4-dioptra-pick"><input type="checkbox" checked={picked.includes(card.id)} aria-label={card.title} onChange={() => setPicked((current) => (current.includes(card.id) ? current.filter((item) => item !== card.id) : [...current, card.id]))} /></label>
              <div>
                {on && !viewer ? (
                  <input className="c4-field" aria-label={v4("dptEdit")} aria-required={false} value={card.title} onChange={(event) => store(editDioptra(cards, card.id, event.target.value))} />
                ) : (
                  <strong>{card.title}</strong>
                )}
                <p className="c4-dioptra-meta">{card.surveyor || v4("dptSurveyor")} · {bearingLabel(v4, card.bearing)} · {finishLabel(v4, card.finish)} · {card.altitude ?? "·"} · {v4("dptVane")} {card.vane}{card.tags.length ? ` · ${card.tags.join("")}` : ""}{card.audit ? ` · ${AUDIT_KEY[card.audit] ? v4(AUDIT_KEY[card.audit]) : card.audit}` : ""}</p>
                {on && !viewer ? (
                  <input className="c4-field" aria-label={v4("dptNote")} aria-required={false} value={card.note} onChange={(event) => store(editDioptraNote(cards, card.id, event.target.value))} />
                ) : (
                  card.note && <p className="c4-dioptra-meta">{card.note}</p>
                )}
                <div className="c4-dioptra-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setDioptraAligned(cards, card.id, !card.aligned))}>{card.aligned ? v4("dptClear") : v4("dptAlign")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setDioptraCase(cards, card.id, !card.cased))}>{card.cased ? v4("dptUncase") : v4("dptCaseIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setDioptraVault(cards, card.id, !card.vaulted))}>{card.vaulted ? v4("dptUnvault") : v4("dptVaultIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setDioptraStar(cards, card.id, !card.flagged))}>{card.flagged ? v4("dptUnstar") : v4("dptStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setDioptraFinish(cards, card.id, cycleFinish(card.finish)))}>{v4("dptFinish")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(liftAltitudeFocused(cards, card.id))}>{v4("dptLift")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerAltitudeFocused(cards, card.id))}>{v4("dptLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseVaneFocused(cards, card.id))}>{v4("dptVane")}+</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerVaneFocused(cards, card.id))}>{v4("dptVane")}−</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addDioptraTag(cards, card.id, "n"))}>{v4("dptTag")} n</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(tagDioptraFocused(cards, card.id))}>{v4("dptTag")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(dioptraCopy(card)); }}>{v4("dptCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="c4-dioptra-meta">{v4("dptMatched")} {counts.matched} · {ids.length}</p>
    </section>
  );
}

const MAIL_SHAPES: EmailShape[] = ["all", "spark", "plus", "alias", "digit", "house", "nest", "work", "open", "soon", "letter", "mixed", "upper", "lower", "space", "even", "odd", "vowel", "tail", "mark", "first", "held"];

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  spark: "emlSpark",
  plus: "emlPlus",
  alias: "emlAlias",
  digit: "emlDigit",
  house: "emlHouse",
  nest: "emlNest",
  work: "emlWork",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  ivory: "emlIvory",
  graphite: "emlGraphite",
  champagne: "emlChampagne",
};

const SHAPE_KEY: Record<EmailShape, CrmV4CopyKey> = {
  all: "emlShapeAll",
  spark: "emlShapeSpark",
  plus: "emlShapePlus",
  alias: "emlShapeAlias",
  digit: "emlShapeDigit",
  house: "emlShapeHouse",
  nest: "emlShapeNest",
  work: "emlShapeWork",
  open: "emlShapeOpen",
  soon: "emlShapeSoon",
  letter: "emlShapeLetter",
  mixed: "emlShapeMixed",
  upper: "emlShapeUpper",
  lower: "emlShapeLower",
  space: "emlShapeSpace",
  even: "emlShapeEven",
  odd: "emlShapeOdd",
  vowel: "emlShapeVowel",
  tail: "emlShapeTail",
  mark: "emlShapeMark",
  first: "emlShapeFirst",
  held: "emlShapeHeld",
};

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("emlUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("emlUnmarked");
}

type MailRow = { id?: string; name?: string | null; email?: string | null };

export function EmailPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: MailRow[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<EmailShape>("all");
  const [review, setReview] = useState<EmailReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [focusAt, setFocusAt] = useState(0);
  const [copied, setCopied] = useState("");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";

  useEffect(() => {
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  const rows = useMemo<EmailRow[]>(() => {
    return (queue.data?.users || []).map((row, index) => ({
      id: textField(row.id) || `c${index}`,
      label: textField(row.name),
      handle: { email: textField(row.email) } satisfies EmailValue,
    }));
  }, [queue.data]);

  useEffect(() => {
    const ids = rows.map((row) => row.id);
    setHidden(readHiddenEmail(readJson(EML_KEY, []), presentEmailLanes(rows)));
    setReviewed(readReviewedEmail(readJson(EML_REVIEW_KEY, []), ids));
  }, [rows]);

  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(EML_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(EML_REVIEW_KEY, next);
  }

  const lanes = visibleEmailLanes(presentEmailLanes(rows), hidden, showHidden);
  const shown = visibleEmail(rows, lane, hue, query, review, reviewed, shape).filter((row) => !hidden.includes(emailLane(row.handle)) || showHidden);
  const bars = emailLanes(rows);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const lead = leadingEmail(rows);
  const leadHue = leadingEmailHue(rows);
  const soon = rows.filter((row) => emailSoon(row.handle)).length;

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocusAt((index) => moveDioptraFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocusAt((index) => moveDioptraFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "m" || event.key === "M") {
        event.preventDefault();
        if (viewer) return;
        const id = shown[focusAt]?.id;
        if (id) storeReviewed(toggleEmailReview(reviewed, id));
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("email-rows.csv", emailRowsCsv(rows, reviewed));
        return;
      }
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focusAt, reviewed, rows, shown, viewer]);

  return (
    <section className="c4-email" aria-label={v4("emlTitle")} data-plates="1" data-names={rows.length} data-role={role}>
      <header className="c4-email-mast">
        <p className="c4-email-seal" data-logo="mono">{v4("emlLogo")}</p>
        <div>
          <p className="c4-email-kicker">{v4("emlSub")}</p>
          <h2 className="c4-title">{v4("emlTitle")}</h2>
        </div>
      </header>
      <ol className="c4-email-index" aria-label={v4("emlTitle")}>
        <li data-tone="gold">{v4("emlSpark")}</li>
        <li data-tone="ink">{v4("emlPlus")}</li>
        <li data-tone="ivory">{v4("emlHouse")}</li>
        <li data-tone="mist">{v4("emlWork")}</li>
        <li data-tone="line">{v4("emlNest")}</li>
      </ol>
      <p className="c4-email-links">
        <Link href={crmv4Href(base, "dpt")}>{v4("dptTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("dptCustomers")}</Link>
        <Link href={crmv4Href(base, "sideglance")}>{v4("sdCloisterKicker")}</Link>
      </p>
      <p className="c4-email-hint">{v4("emlHint")}</p>
      {viewer && <p className="c4-email-note">{v4("emlViewer")}</p>}
      {soon > 0 && <p className="c4-email-notice" role="status">{v4("emlSoon")} {soon}</p>}
      {queue.loading && <p className="c4-email-meta">{v4("emlEmpty")}</p>}
      {queue.error && <p className="c4-email-meta">{queue.error}</p>}
      <ul className="c4-email-kpis" aria-label={v4("emlRules")}>
        <li><span>{v4("emlLead")}</span><strong>{lead ? laneLabel(v4, lead) : v4("emlUnmarked")}</strong></li>
        <li><span>{v4("emlToneLead")}</span><strong>{leadHue ? hueLabel(v4, leadHue) : v4("emlUnmarked")}</strong></li>
        <li><span>{v4("emlSpark")}</span><strong>{laneEmailCount(rows, "spark")}</strong></li>
        <li><span>{v4("emlHouse")}</span><strong>{laneEmailCount(rows, "house")}</strong></li>
        <li><span>{v4("emlShare")}</span><strong>{emailShare(laneEmailCount(rows, "spark"), Math.max(1, rows.length))}%</strong></li>
        <li><span>{v4("emlOpen")}</span><strong>{rows.filter((row) => emailOpen(row.handle)).length}</strong></li>
        <li><span>{v4("emlHeld")}</span><strong>{rows.filter((row) => emailHeld(row.handle)).length}</strong></li>
        <li><span>{v4("emlNest")}</span><strong>{rows.filter((row) => emailNest(row.handle)).length}</strong></li>
      </ul>
      <div className="c4-email-chart" aria-label={v4("emlRules")}>
        {bars.map((bar) => (
          <button key={bar.lane} type="button" className="c4-email-column" data-on={lane === bar.lane ? "1" : "0"} data-lane={bar.lane} onClick={() => setLane(lane === bar.lane ? "all" : bar.lane)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / maxBar) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{laneLabel(v4, bar.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-email-tools">
        <input ref={searchRef} className="c4-field c4-email-search" aria-label={v4("emlSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("emlSearch")} />
        {(["all", "ivory", "graphite", "champagne"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("emlAll") : hueLabel(v4, item)}</button>
        ))}
        {MAIL_SHAPES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{item === "all" ? v4("emlAll") : item === "reviewed" ? v4("emlReviewed") : v4("emlFresh")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("emlShow")}</button>
        <button type="button" className="c4-btn" onClick={() => download("email-lanes.csv", emailLanesCsv(rows))}>{v4("emlCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("email-rows.csv", emailRowsCsv(rows, reviewed))}>{v4("emlRowCsv")}</button>
      </div>
      <ul className="c4-email-lanes">
        {lanes.map((item) => (
          <li key={item}>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(toggleEmail(hidden, item))}>{hidden.includes(item) ? v4("emlShow") : v4("emlHide")} {laneLabel(v4, item)}</button>
          </li>
        ))}
      </ul>
      {picked.length > 0 && (
        <div className="c4-email-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkEmailReview(reviewed, picked, true))}>{v4("emlBulkReview")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkEmailReview(reviewed, picked, false))}>{v4("emlBulkClear")}</button>
        </div>
      )}
      {!shown.length && <p className="c4-email-empty">{v4("emlEmpty")}</p>}
      <ol className="c4-email-board">
        {shown.map((row, index) => {
          const seen = reviewed.includes(row.id);
          const length = emailLength(row.handle);
          const domain = emailDomain(row.handle);
          return (
            <li key={row.id} className="c4-email-card" data-on={index === focusAt ? "1" : "0"} data-lane={emailLane(row.handle)} data-hue={emailHue(row.handle)} data-reviewed={seen ? "1" : "0"} data-spark={emailSpark(row.handle) ? "1" : "0"} data-plus={emailPlus(row.handle) ? "1" : "0"} data-house={emailHouse(row.handle) ? "1" : "0"} data-soon={emailSoon(row.handle) ? "1" : "0"}>
              <p className="c4-email-stamp">{emailStamp(row.handle) || "·"}</p>
              <label className="c4-email-pick"><input type="checkbox" checked={picked.includes(row.id)} aria-label={row.label || row.id} onChange={() => setPicked((current) => (current.includes(row.id) ? current.filter((item) => item !== row.id) : [...current, row.id]))} /></label>
              <div>
                <strong>{row.label || v4("emlUnmarked")}</strong>
                <p className="c4-email-meta">{laneLabel(v4, emailLane(row.handle))} · {hueLabel(v4, emailHue(row.handle))}{domain ? ` · ${domain}` : ""}{length !== null ? ` · ${length}` : ""}{emailDigit(row.handle) ? ` · ${v4("emlDigit")}` : ""}{emailLetter(row.handle) ? ` · ${v4("emlLetter")}` : ""}{emailMixed(row.handle) ? ` · ${v4("emlMixed")}` : ""}{emailUpper(row.handle) ? ` · ${v4("emlUpper")}` : ""}{emailLower(row.handle) ? ` · ${v4("emlLower")}` : ""}{emailEven(row.handle) ? ` · ${v4("emlEven")}` : ""}{emailVowel(row.handle) ? ` · ${v4("emlVowel")}` : ""}{emailFirst(row.handle) ? ` · ${v4("emlFirst")}` : ""}{emailTail(row.handle) ? ` · ${v4("emlTail")}` : ""}{emailMark(row.handle) ? ` · ${v4("emlMark")}` : ""}{emailSpace(row.handle) ? ` · ${v4("emlSpace")}` : ""}{emailAlias(row.handle) ? ` · ${v4("emlAlias")}` : ""}{emailWork(row.handle) ? ` · ${v4("emlWork")}` : ""}{emailHeld(row.handle) ? ` · ${v4("emlHeld")}` : ""}{emailSoon(row.handle) ? ` · ${v4("emlSoon")}` : ""}{emailOpen(row.handle) ? ` · ${v4("emlOpen")}` : ""}</p>
                <div className="c4-email-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleEmailReview(reviewed, row.id))}>{seen ? v4("emlReviewed") : v4("emlReview")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(emailCopy(row.handle)); setCopied(row.id); }}>{copied === row.id ? v4("emlCopied") : v4("emlCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
