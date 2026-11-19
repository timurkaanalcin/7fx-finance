"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  GRAPH_FACES,
  GPH_DENSITY_KEY,
  GPH_KEY,
  GPH_VIEW_KEY,
  OSP_KEY,
  OSP_REVIEW_KEY,
  addGraphTag,
  addGraphView,
  alignGraphFocused,
  addGraphometer,
  briskGraph,
  bulkGraphAlign,
  bulkGraphChampagne,
  bulkGraphTag,
  bulkGraphVault,
  bulkOsReview,
  busiestGraphSurveyor,
  caseGraphFocused,
  cycleFinish,
  dropGraphView,
  editGraphNote,
  editGraphometer,
  fairGraphSurveyor,
  finishFocused,
  graphBars,
  graphCopy,
  graphCounts,
  graphCsv,
  graphDensity,
  graphSurveyors,
  graphTimeline,
  idleGraph,
  innerFace,
  laneOsCount,
  lateGraph,
  leadingOs,
  leadingOsHue,
  liftPitchFocused,
  lowerLimbFocused,
  lowerPitchFocused,
  moveGraphFocus,
  osCapital,
  osCopy,
  osDigit,
  osEven,
  osFamily,
  osFirst,
  osHeld,
  osHouse,
  osHue,
  osLane,
  osLanes,
  osLanesCsv,
  osLength,
  osLetter,
  osLower,
  osMixed,
  osOpen,
  osPair,
  osPost,
  osRowsCsv,
  osSeed,
  osShare,
  osSlash,
  osSoon,
  osSpace,
  osSpark,
  osStack,
  osStamp,
  osTail,
  osUpper,
  osVowel,
  outerFace,
  overdueGraph,
  presentOsLanes,
  raiseLimbFocused,
  readGraphViews,
  readGraphometers,
  readHiddenOs,
  readReviewedOs,
  reminderGraphs,
  restingGraph,
  setGraphAligned,
  setGraphCase,
  setGraphFinish,
  setGraphStar,
  setGraphVault,
  sortGraphometers,
  starGraphFocused,
  suggestFace,
  suggestGraphFinish,
  suggestPitch,
  tagGraphFocused,
  toggleOs,
  toggleOsReview,
  visibleGraphometers,
  visibleOs,
  visibleOsLanes,
  type GraphDensity,
  type GraphSort,
  type GraphTray,
  type GraphView,
  type Graphometer,
  type OsReview,
  type OsRow,
  type OsShape,
  type OsValue,
} from "@/lib/crmv4/round299";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const FINISHES = ["IVORY", "GRAPHITE", "CHAMPAGNE"] as const;
const PITCHES = ["5", "10", "20", "40"] as const;
const LIMBS = ["1", "3", "5"] as const;
const FACE_KEY: Record<string, CrmV4CopyKey> = {
  face: "gphFace",
  back: "gphBack",
  edge: "gphEdge",
  rim: "gphRim",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "gphAuditSave",
  edit: "gphAuditEdit",
  note: "gphAuditNote",
  finish: "gphAuditFinish",
  align: "gphAuditAlign",
  clear: "gphAuditClear",
  case: "gphAuditCase",
  resume: "gphAuditResume",
  vault: "gphAuditVault",
  open: "gphAuditOpen",
  tag: "gphAuditTag",
  limb: "gphAuditLimb",
  pitch: "gphAuditPitch",
  lower: "gphAuditLower",
  star: "gphAuditStar",
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

function faceLabel(v4: V4, face: string): string {
  const key = FACE_KEY[face];
  return key ? v4(key) : v4("gphBlankFace");
}

function finishLabel(v4: V4, finish: string): string {
  if (finish === "IVORY") return v4("gphIvory");
  if (finish === "GRAPHITE") return v4("gphGraphite");
  if (finish === "CHAMPAGNE") return v4("gphChampagne");
  return v4("gphAll");
}

export function GraphometerArcs({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Graphometer[]>([]);
  const [views, setViews] = useState<GraphView[]>([]);
  const [density, setDensity] = useState<GraphDensity>("broad");
  const [tray, setTray] = useState<GraphTray>("bench");
  const [query, setQuery] = useState("");
  const [surveyorFilter, setSurveyorFilter] = useState("");
  const [finishFilter, setFinishFilter] = useState("all");
  const [faceFilter, setFaceFilter] = useState("all");
  const [pitchFilter, setPitchFilter] = useState("all");
  const [limbFilter, setLimbFilter] = useState("all");
  const [sort, setSort] = useState<GraphSort>("face");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [surveyor, setSurveyor] = useState("");
  const [face, setFace] = useState("");
  const [finish, setFinish] = useState("");
  const [pitchNo, setPitchNo] = useState("");
  const [limbNo, setLimbNo] = useState("");
  const [tags, setTags] = useState("");
  const [viewName, setViewName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focusAt, setFocusAt] = useState(0);
  const [desk, setDesk] = useState("face");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readGraphometers(readJson(GPH_KEY, [])));
    setViews(readGraphViews(readJson(GPH_VIEW_KEY, [])));
    setDensity(graphDensity(readJson(GPH_DENSITY_KEY, "broad")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Graphometer[]) {
    setCards(next);
    writeJson(GPH_KEY, next);
  }
  function storeViews(next: GraphView[]) {
    setViews(next);
    writeJson(GPH_VIEW_KEY, next);
  }
  function storeDensity(next: GraphDensity) {
    setDensity(next);
    writeJson(GPH_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortGraphometers(visibleGraphometers(cards, tray, query, surveyorFilter, finishFilter, faceFilter, pitchFilter, limbFilter), sort),
    [cards, tray, query, surveyorFilter, finishFilter, faceFilter, pitchFilter, limbFilter, sort],
  );
  const counts = graphCounts(cards, shown, desk);
  const bars = graphBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = graphTimeline(cards);
  const surveyors = graphSurveyors(cards);
  const ids = shown.map((card) => card.id);
  const suggested = suggestGraphFinish(cards);
  const fair = fairGraphSurveyor(cards, surveyors.join(","));
  const busy = busiestGraphSurveyor(cards);
  const reminders = reminderGraphs(cards);
  const pitchHint = suggestPitch(cards, clock);
  const faceHint = suggestFace(clock);
  const focused = shown[focusAt];

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setTitle("");
        setNote("");
        setSurveyor("");
        setFace("");
        setFinish("");
        setPitchNo("");
        setLimbNo("");
        setTags("");
        return;
      }
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocusAt((index) => moveGraphFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocusAt((index) => moveGraphFocus(index, shown.length, -1));
        return;
      }
      if (viewer) return;
      const id = shown[focusAt]?.id || "";
      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        store(liftPitchFocused(cards, id));
        return;
      }
      if (event.key === "v" || event.key === "V") {
        event.preventDefault();
        store(setGraphVault(cards, id, !shown[focusAt]?.vaulted));
        return;
      }
      if (event.key === "m" || event.key === "M") {
        event.preventDefault();
        store(finishFocused(cards, id));
        return;
      }
      if (event.key === "c" || event.key === "C") {
        event.preventDefault();
        store(caseGraphFocused(cards, id));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        store(alignGraphFocused(cards, id));
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("graphometer-arcs.csv", graphCsv(shown, desk));
        return;
      }
      if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        store(starGraphFocused(cards, id));
        return;
      }
      if (event.key === "u" || event.key === "U") {
        event.preventDefault();
        store(raiseLimbFocused(cards, id));
        return;
      }
      if (event.key === "d" || event.key === "D") {
        event.preventDefault();
        store(lowerLimbFocused(cards, id));
        return;
      }
      if (event.key === "o" || event.key === "O") {
        event.preventDefault();
        store(lowerPitchFocused(cards, id));
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
    <section className="c4-graph" aria-label={v4("gphTitle")} data-cards="1" data-desk={tray} data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-graph-mast">
        <p className="c4-graph-seal" data-logo="mono">{v4("gphLogo")}</p>
        <div>
          <p className="c4-graph-kicker">{v4("gphSub")}</p>
          <h2 className="c4-title">{v4("gphTitle")}</h2>
        </div>
        <ol className="c4-graph-index" aria-label={v4("gphTitle")}>
          <li data-tone="gold">{v4("gphBench")}</li>
          <li data-tone="ink">{v4("gphCase")}</li>
          <li data-tone="ivory">{v4("gphVault")}</li>
        </ol>
      </header>
      <p className="c4-graph-links">
        <Link href={crmv4Href(base, "osp")}>{v4("ospTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("gphCustomers")}</Link>
        <Link href={crmv4Href(base, "sourceglance")}>{v4("lsAmbulatoryKicker")}</Link>
        <Link href={crmv4Href(base, "assignee")}>{v4("gnTriforiumKicker")}</Link>
      </p>
      <p className="c4-graph-hint">{v4("gphHint")}</p>
      {viewer && <p className="c4-graph-note">{v4("gphViewer")}</p>}
      {counts.overdue > 0 && <p className="c4-graph-notice" role="status">{v4("gphOverdue")} {counts.overdue}</p>}
      <ol className="c4-graph-dials" aria-label={v4("gphChart")}>
        <li><span>{v4("gphInner")}</span><strong>{counts.inner}</strong></li>
        <li><span>{v4("gphOuter")}</span><strong>{counts.outer}</strong></li>
        <li><span>{v4("gphAlign")}</span><strong>{counts.aligned}</strong></li>
        <li><span>{v4("gphWide")}</span><strong>{counts.wide}</strong></li>
        <li><span>{v4("gphHouse")}</span><strong>{counts.house}</strong></li>
        <li><span>{v4("gphIdle")}</span><strong>{counts.idle}</strong></li>
        <li><span>{v4("gphBrisk")}</span><strong>{counts.brisk}</strong></li>
        <li><span>{v4("gphMatched")}</span><strong>{counts.matched}</strong></li>
      </ol>
      <div className="c4-graph-chart" aria-label={v4("gphChart")}>
        {bars.map((bar) => (
          <button key={bar.face} type="button" className="c4-graph-column" data-on={faceFilter === bar.face ? "1" : "0"} data-face={bar.face} onClick={() => setFaceFilter(faceFilter === bar.face ? "all" : bar.face)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{faceLabel(v4, bar.face)}</span>
          </button>
        ))}
      </div>
      <div className="c4-graph-tools">
        <input ref={searchRef} className="c4-field c4-graph-search" aria-label={v4("gphSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("gphSearch")} />
        <select className="c4-select" aria-label={v4("gphSurveyor")} value={surveyorFilter} onChange={(event) => setSurveyorFilter(event.target.value)}>
          <option value="">{v4("gphSurveyor")}</option>
          {surveyors.map((name) => <option key={name} value={name}>{name}</option>)}
        </select>
        {(["bench", "case", "vault"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "bench" ? "gphBench" : item === "case" ? "gphCase" : "gphVault")}</button>
        ))}
        {(["all", "inner", "outer", ...GRAPH_FACES] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={faceFilter === item ? "1" : "0"} onClick={() => setFaceFilter(item)}>{item === "all" ? v4("gphAll") : item === "inner" ? v4("gphInner") : item === "outer" ? v4("gphOuter") : faceLabel(v4, item)}</button>
        ))}
        {["all", ...FINISHES].map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={finishFilter === item ? "1" : "0"} onClick={() => setFinishFilter(item)}>{item === "all" ? v4("gphFinish") : finishLabel(v4, item)}</button>
        ))}
        {["all", ...PITCHES].map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={pitchFilter === item ? "1" : "0"} onClick={() => setPitchFilter(item)}>{item === "all" ? v4("gphPitch") : item}</button>
        ))}
        {["all", ...LIMBS].map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={limbFilter === item ? "1" : "0"} onClick={() => setLimbFilter(item)}>{item === "all" ? v4("gphLimb") : item}</button>
        ))}
        <button type="button" className="c4-chip" data-on={sort === "surveyor" ? "1" : "0"} onClick={() => setSort(sort === "face" ? "surveyor" : "face")}>{sort === "face" ? v4("gphSortFace") : v4("gphSortSurveyor")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "broad" ? "tight" : "broad")}>{density === "broad" ? v4("gphBroad") : v4("gphTight")}</button>
        <button type="button" className="c4-btn" onClick={() => download("graphometer-arcs.csv", graphCsv(shown, desk))}>{v4("gphCsv")}</button>
      </div>
      <div className="c4-graph-tools" role="group" aria-label={v4("gphDesk")}>
        {GRAPH_FACES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={desk === item ? "1" : "0"} onClick={() => setDesk(item)}>{v4("gphDesk")} {faceLabel(v4, item)}</button>
        ))}
        <span className="c4-graph-meta">{v4("gphSuggest")} {finishLabel(v4, suggested)} · {pitchHint} · {faceLabel(v4, faceHint)}</span>
        <span className="c4-graph-meta">{v4("gphFair")} {fair || "·"} · {v4("gphBusy")} {busy || "·"}</span>
      </div>
      <form className="c4-graph-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addGraphometer(cards, { title, note, surveyor, face, finish: finish || suggested, pitch: pitchNo, limb: limbNo, tags });
        if (next.length === cards.length) return;
        store(next);
        setTitle("");
        setNote("");
        setTags("");
      }}>
        <input className="c4-field" aria-label={v4("gphEdit")} aria-required={false} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} placeholder={v4("gphTitle")} />
        <input className="c4-field" aria-label={v4("gphNote")} aria-required={false} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} placeholder={v4("gphNote")} />
        <input className="c4-field" aria-label={v4("gphSurveyor")} aria-required={false} value={surveyor} disabled={viewer} onChange={(event) => setSurveyor(event.target.value)} placeholder={v4("gphSurveyor")} />
        <select className="c4-select" aria-label={v4("gphDesk")} value={face} disabled={viewer} onChange={(event) => setFace(event.target.value)}>
          <option value="">{v4("gphBlankFace")}</option>
          {GRAPH_FACES.map((item) => <option key={item} value={item}>{faceLabel(v4, item)}</option>)}
        </select>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("gphAdd")}</button>
      </form>
      <form className="c4-graph-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addGraphView(views, { id: `v${Date.now().toString(36)}`, name: viewName, tray, query, surveyor: surveyorFilter, finish: finishFilter, face: faceFilter, pitch: pitchFilter, limb: limbFilter });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <input className="c4-field" aria-label={v4("gphViewName")} aria-required={false} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} placeholder={v4("gphViewName")} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("gphSaveView")}</button>
      </form>
      <ul className="c4-graph-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setSurveyorFilter(view.surveyor); setFinishFilter(view.finish); setFaceFilter(view.face); setPitchFilter(view.pitch); setLimbFilter(view.limb); }}>{v4("gphApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropGraphView(views, view.id))}>{v4("gphDrop")}</button>
          </li>
        ))}
      </ul>
      {picked.length > 0 && (
        <div className="c4-graph-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkGraphChampagne(cards, picked))}>{v4("gphBulkChampagne")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkGraphAlign(cards, picked))}>{v4("gphBulkAlign")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkGraphVault(cards, picked))}>{v4("gphBulkVault")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkGraphTag(cards, picked))}>{v4("gphBulkTag")}</button>
        </div>
      )}
      <p className="c4-graph-meta">{v4("gphKeys")} · j k a c m v s o p u d x /</p>
      {timeline.length > 0 && (
        <ol className="c4-graph-time" aria-label={v4("gphTimeline")}>
          {timeline.map((lane) => (
            <li key={lane.pitch}><span>{v4("gphPitch")} {lane.pitch}</span><strong>{lane.titles.join(" · ")}</strong></li>
          ))}
        </ol>
      )}
      {reminders.length > 0 && <p className="c4-graph-meta">{v4("gphRemind")} {reminders.join(" · ")}</p>}
      {!shown.length && <p className="c4-graph-empty">{v4("gphEmpty")}</p>}
      <ol className="c4-graph-board">
        {shown.map((card, index) => {
          const on = index === focusAt;
          return (
            <li key={card.id} className="c4-graph-card" data-on={on ? "1" : "0"} data-overdue={overdueGraph(card) ? "1" : "0"} data-idle={idleGraph(card) ? "1" : "0"} data-brisk={briskGraph(card) ? "1" : "0"} data-resting={restingGraph(card) ? "1" : "0"} data-late={lateGraph(card, desk) ? "1" : "0"} data-outer={outerFace(card.face) ? "1" : "0"} data-inner={innerFace(card.face) ? "1" : "0"} data-star={card.flagged ? "1" : "0"}>
              <label className="c4-graph-pick"><input type="checkbox" checked={picked.includes(card.id)} aria-label={card.title} onChange={() => setPicked((current) => (current.includes(card.id) ? current.filter((item) => item !== card.id) : [...current, card.id]))} /></label>
              <div>
                {on ? (
                  <input className="c4-field" aria-label={v4("gphEdit")} aria-required={false} value={card.title} onChange={(event) => store(editGraphometer(cards, card.id, event.target.value))} />
                ) : (
                  <strong>{card.title}</strong>
                )}
                <p className="c4-graph-meta">{card.surveyor || v4("gphSurveyor")} · {faceLabel(v4, card.face)} · {finishLabel(v4, card.finish)} · {card.pitch ?? "·"} · {v4("gphLimb")} {card.limb}{card.tags.length ? ` · ${card.tags.join("")}` : ""}{card.audit ? ` · ${AUDIT_KEY[card.audit] ? v4(AUDIT_KEY[card.audit]) : card.audit}` : ""}</p>
                {on ? (
                  <input className="c4-field" aria-label={v4("gphNote")} aria-required={false} value={card.note} onChange={(event) => store(editGraphNote(cards, card.id, event.target.value))} />
                ) : (
                  card.note && <p className="c4-graph-meta">{card.note}</p>
                )}
                <div className="c4-graph-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setGraphAligned(cards, card.id, !card.aligned))}>{card.aligned ? v4("gphClear") : v4("gphAlign")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setGraphCase(cards, card.id, !card.cased))}>{card.cased ? v4("gphUncase") : v4("gphCaseIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setGraphVault(cards, card.id, !card.vaulted))}>{card.vaulted ? v4("gphUnvault") : v4("gphVaultIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setGraphStar(cards, card.id, !card.flagged))}>{card.flagged ? v4("gphUnstar") : v4("gphStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setGraphFinish(cards, card.id, cycleFinish(card.finish)))}>{v4("gphFinish")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(liftPitchFocused(cards, card.id))}>{v4("gphLift")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerPitchFocused(cards, card.id))}>{v4("gphLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addGraphTag(cards, card.id, "n"))}>{v4("gphTag")} n</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(tagGraphFocused(cards, card.id))}>{v4("gphTag")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(graphCopy(card)); }}>{v4("gphCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="c4-graph-meta">{v4("gphMatched")} {counts.matched} · {ids.length}</p>
    </section>
  );
}

const OS_SHAPES: OsShape[] = ["all", "seed", "stack", "pair", "house", "spark", "post", "open", "soon", "letter", "mixed", "upper", "lower", "space", "even", "odd", "vowel", "tail", "digit", "first", "held", "slash"];

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  seed: "ospSeed",
  stack: "ospStack",
  pair: "ospPair",
  house: "ospHouse",
  spark: "ospSpark",
  post: "ospPost",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  ivory: "ospIvory",
  graphite: "ospGraphite",
  champagne: "ospChampagne",
};

const SHAPE_KEY: Record<OsShape, CrmV4CopyKey> = {
  all: "ospShapeAll",
  seed: "ospShapeSeed",
  stack: "ospShapeStack",
  pair: "ospShapePair",
  house: "ospShapeHouse",
  spark: "ospShapeSpark",
  post: "ospShapePost",
  open: "ospShapeOpen",
  soon: "ospShapeSoon",
  letter: "ospShapeLetter",
  mixed: "ospShapeMixed",
  upper: "ospShapeUpper",
  lower: "ospShapeLower",
  space: "ospShapeSpace",
  even: "ospShapeEven",
  odd: "ospShapeOdd",
  vowel: "ospShapeVowel",
  tail: "ospShapeTail",
  digit: "ospShapeDigit",
  first: "ospShapeFirst",
  held: "ospShapeHeld",
  slash: "ospShapeSlash",
};

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("ospUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("ospUnmarked");
}

type OsUser = { id?: string; name?: string | null; lastOs?: string | null };

export function SystemPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: OsUser[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<OsShape>("all");
  const [review, setReview] = useState<OsReview>("all");
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

  const rows = useMemo<OsRow[]>(() => {
    return (queue.data?.users || []).map((row, index) => ({
      id: textField(row.id) || `c${index}`,
      label: textField(row.name),
      system: { lastOs: textField(row.lastOs) } satisfies OsValue,
    }));
  }, [queue.data]);

  useEffect(() => {
    const ids = rows.map((row) => row.id);
    setHidden(readHiddenOs(readJson(OSP_KEY, []), presentOsLanes(rows)));
    setReviewed(readReviewedOs(readJson(OSP_REVIEW_KEY, []), ids));
  }, [rows]);

  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(OSP_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(OSP_REVIEW_KEY, next);
  }

  const lanes = visibleOsLanes(presentOsLanes(rows), hidden, showHidden);
  const shown = visibleOs(rows, lane, hue, query, review, reviewed, shape).filter((row) => !hidden.includes(osLane(row.system)) || showHidden);
  const bars = osLanes(rows);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const lead = leadingOs(rows);
  const leadHue = leadingOsHue(rows);
  const soon = rows.filter((row) => osSoon(row.system)).length;

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocusAt((index) => moveGraphFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocusAt((index) => moveGraphFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        if (viewer) return;
        const id = shown[focusAt]?.id;
        if (id) storeReviewed(toggleOsReview(reviewed, id));
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("system-rows.csv", osRowsCsv(rows, reviewed));
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
    <section className="c4-os" aria-label={v4("ospTitle")} data-plates="1" data-names={rows.length} data-role={role}>
      <header className="c4-os-mast">
        <p className="c4-os-seal" data-logo="mono">{v4("ospLogo")}</p>
        <div>
          <p className="c4-os-kicker">{v4("ospSub")}</p>
          <h2 className="c4-title">{v4("ospTitle")}</h2>
        </div>
      </header>
      <ol className="c4-os-index" aria-label={v4("ospTitle")}>
        <li data-tone="gold">{v4("ospSeed")}</li>
        <li data-tone="ink">{v4("ospStack")}</li>
        <li data-tone="ivory">{v4("ospHouse")}</li>
        <li data-tone="mist">{v4("ospPost")}</li>
        <li data-tone="line">{v4("ospPair")}</li>
      </ol>
      <p className="c4-os-links">
        <Link href={crmv4Href(base, "gph")}>{v4("gphTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("gphCustomers")}</Link>
        <Link href={crmv4Href(base, "sourceglance")}>{v4("lsAmbulatoryKicker")}</Link>
      </p>
      <p className="c4-os-hint">{v4("ospHint")}</p>
      {viewer && <p className="c4-os-note">{v4("ospViewer")}</p>}
      {soon > 0 && <p className="c4-os-notice" role="status">{v4("ospSoon")} {soon}</p>}
      {queue.loading && <p className="c4-os-meta">{v4("ospEmpty")}</p>}
      {queue.error && <p className="c4-os-meta">{queue.error}</p>}
      <ul className="c4-os-kpis" aria-label={v4("ospRules")}>
        <li><span>{v4("ospLead")}</span><strong>{lead ? laneLabel(v4, lead) : v4("ospUnmarked")}</strong></li>
        <li><span>{v4("ospToneLead")}</span><strong>{leadHue ? hueLabel(v4, leadHue) : v4("ospUnmarked")}</strong></li>
        <li><span>{v4("ospSeed")}</span><strong>{laneOsCount(rows, "seed")}</strong></li>
        <li><span>{v4("ospHouse")}</span><strong>{laneOsCount(rows, "house")}</strong></li>
        <li><span>{v4("ospShare")}</span><strong>{osShare(laneOsCount(rows, "house"), Math.max(1, rows.length))}%</strong></li>
        <li><span>{v4("ospOpen")}</span><strong>{rows.filter((row) => osOpen(row.system)).length}</strong></li>
        <li><span>{v4("ospHeld")}</span><strong>{rows.filter((row) => osHeld(row.system)).length}</strong></li>
        <li><span>{v4("ospPair")}</span><strong>{rows.filter((row) => osPair(row.system)).length}</strong></li>
      </ul>
      <div className="c4-os-chart" aria-label={v4("ospRules")}>
        {bars.map((bar) => (
          <button key={bar.lane} type="button" className="c4-os-column" data-on={lane === bar.lane ? "1" : "0"} data-lane={bar.lane} onClick={() => setLane(lane === bar.lane ? "all" : bar.lane)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / maxBar) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{laneLabel(v4, bar.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-os-tools">
        <input ref={searchRef} className="c4-field c4-os-search" aria-label={v4("ospSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("ospSearch")} />
        {(["all", "ivory", "graphite", "champagne"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("ospAll") : hueLabel(v4, item)}</button>
        ))}
        {OS_SHAPES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{item === "all" ? v4("ospAll") : item === "reviewed" ? v4("ospReviewed") : v4("ospFresh")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("ospShow")}</button>
        <button type="button" className="c4-btn" onClick={() => download("system-lanes.csv", osLanesCsv(rows))}>{v4("ospCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("system-rows.csv", osRowsCsv(rows, reviewed))}>{v4("ospRowCsv")}</button>
      </div>
      <ul className="c4-os-lanes">
        {lanes.map((item) => (
          <li key={item}>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(toggleOs(hidden, item))}>{hidden.includes(item) ? v4("ospShow") : v4("ospHide")} {laneLabel(v4, item)}</button>
          </li>
        ))}
      </ul>
      {picked.length > 0 && (
        <div className="c4-os-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkOsReview(reviewed, picked, true))}>{v4("ospBulkReview")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkOsReview(reviewed, picked, false))}>{v4("ospBulkClear")}</button>
        </div>
      )}
      {!shown.length && <p className="c4-os-empty">{v4("ospEmpty")}</p>}
      <ol className="c4-os-board">
        {shown.map((row, index) => {
          const seen = reviewed.includes(row.id);
          const length = osLength(row.system);
          const family = osFamily(row.system);
          return (
            <li key={row.id} className="c4-os-card" data-on={index === focusAt ? "1" : "0"} data-lane={osLane(row.system)} data-hue={osHue(row.system)} data-reviewed={seen ? "1" : "0"} data-seed={osSeed(row.system) ? "1" : "0"} data-stack={osStack(row.system) ? "1" : "0"} data-house={osHouse(row.system) ? "1" : "0"} data-soon={osSoon(row.system) ? "1" : "0"}>
              <p className="c4-os-stamp">{osStamp(row.system) || "·"}</p>
              <label className="c4-os-pick"><input type="checkbox" checked={picked.includes(row.id)} aria-label={row.label || row.id} onChange={() => setPicked((current) => (current.includes(row.id) ? current.filter((item) => item !== row.id) : [...current, row.id]))} /></label>
              <div>
                <strong>{row.label || v4("ospUnmarked")}</strong>
                <p className="c4-os-meta">{laneLabel(v4, osLane(row.system))} · {hueLabel(v4, osHue(row.system))}{family ? ` · ${family}` : ""}{length !== null ? ` · ${length}` : ""}{osDigit(row.system) ? ` · ${v4("ospDigit")}` : ""}{osLetter(row.system) ? ` · ${v4("ospLetter")}` : ""}{osMixed(row.system) ? ` · ${v4("ospMixed")}` : ""}{osUpper(row.system) ? ` · ${v4("ospUpper")}` : ""}{osLower(row.system) ? ` · ${v4("ospLower")}` : ""}{osEven(row.system) ? ` · ${v4("ospEven")}` : ""}{osVowel(row.system) ? ` · ${v4("ospVowel")}` : ""}{osFirst(row.system) ? ` · ${v4("ospFirst")}` : ""}{osTail(row.system) ? ` · ${v4("ospTail")}` : ""}{osCapital(row.system) ? ` · ${v4("ospCapital")}` : ""}{osSpace(row.system) ? ` · ${v4("ospSpace")}` : ""}{osSlash(row.system) ? ` · ${v4("ospSlash")}` : ""}{osPost(row.system) ? ` · ${v4("ospPost")}` : ""}{osSpark(row.system) ? ` · ${v4("ospSpark")}` : ""}{osHeld(row.system) ? ` · ${v4("ospHeld")}` : ""}{osSoon(row.system) ? ` · ${v4("ospSoon")}` : ""}{osOpen(row.system) ? ` · ${v4("ospOpen")}` : ""}{osSeed(row.system) ? ` · ${v4("ospSeed")}` : ""}</p>
                <div className="c4-os-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleOsReview(reviewed, row.id))}>{seen ? v4("ospReviewed") : v4("ospReview")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(osCopy(row.system)); setCopied(row.id); }}>{copied === row.id ? v4("ospCopied") : v4("ospCopy")}</button>
                  <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("gphCustomers")}</Link>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
