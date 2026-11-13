"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  EMPTY_TIMER,
  LICENSE_KEY,
  TIMER_KEY,
  activeLicense,
  chooseMode,
  formatClock,
  licenseKind,
  licenseSplit,
  otherStatuses,
  pauseTimer,
  presentLicenses,
  readHiddenLicenses,
  readTimer,
  resetTimer,
  setCountdownMinutes,
  showMs,
  startTimer,
  toggleLicense,
  visibleLicenseRows,
  visibleLicenses,
  type LicenseInput,
  type LicenseKind,
  type TimerMode,
  type TimerState,
} from "@/lib/crmv4/round84";
import { crmv4Href } from "@/lib/crmv4/sections";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const MODE_LABEL: Record<TimerMode, CrmV4CopyKey> = {
  stopwatch: "dtStopwatch",
  countdown: "dtCountdown",
};

const KIND_LABEL: Record<LicenseKind, CrmV4CopyKey> = {
  active: "lcActive",
  expired: "lcExpired",
};

type License = LicenseInput & {
  id: string;
  regulator?: string | null;
  number?: string | null;
  entity?: string | null;
};

type GlanceRow = LicenseInput & { id: string };

export function DeskTimer({ v4 }: { v4: V4 }) {
  const [timer, setTimer] = useState<TimerState>(EMPTY_TIMER);
  const [minutes, setMinutes] = useState("");
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { setTimer(readTimer(readJson(TIMER_KEY, EMPTY_TIMER))); }, []);
  useEffect(() => {
    if (!timer.running) return;
    const id = window.setInterval(() => {
      const tick = Date.now();
      setNow(tick);
      setTimer((current) => {
        if (current.mode !== "countdown" || !current.running || showMs(current, tick) > 0) return current;
        const next = pauseTimer(current, tick);
        writeJson(TIMER_KEY, next);
        return next;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [timer.running]);

  function store(next: TimerState) {
    setTimer(next);
    setNow(Date.now());
    writeJson(TIMER_KEY, next);
  }

  return (
    <section className="c4-desk-timer c4-hour-dial" aria-label={v4("dtTitle")} data-desk-timer="1" data-desk="dial" data-running={timer.running ? "1" : "0"} data-mode={timer.mode}>
      <header className="c4-hour-dial-mast">
        <p className="c4-hour-dial-seal" data-logo="mono">7FX</p>
        <div>
          <p className="c4-hour-dial-kicker">{v4("dtDialKicker")}</p>
          <h2 className="c4-title c4-hour-dial-title">{v4("dtTitle")}</h2>
          <p className="c4-hour-dial-lead">{v4("dtDialLead")}</p>
        </div>
        <p className="c4-timer-face c4-hour-dial-face">{formatClock(showMs(timer, now))}</p>
      </header>
      <ol className="c4-hour-dial-index" aria-label={v4("dtTitle")}>
        <li data-tone="gold">{v4("dtDialGold")}</li>
        <li data-tone="ink">{v4("dtDialInk")}</li>
        <li data-tone="ivory">{v4("dtDialIvory")}</li>
      </ol>
      <p className="c4-hour-dial-hint">{v4("dtHint")}</p>
      <p className="c4-meta">{v4("dtLocal")}</p>
      <p className="c4-meta">{v4("dtNoServer")}</p>
      <div className="c4-row" role="group" aria-label={v4("dtTitle")}>
        {(["stopwatch", "countdown"] as const).map((mode) => (
          <button key={mode} type="button" className="c4-chip" data-on={timer.mode === mode ? "1" : "0"} aria-pressed={timer.mode === mode} onClick={() => store(chooseMode(timer, mode))}>
            {v4(MODE_LABEL[mode])}
          </button>
        ))}
      </div>
      <form className="c4-row" onSubmit={(event) => {
        event.preventDefault();
        const next = setCountdownMinutes(timer, minutes);
        if (next === timer) return;
        store(next);
        setMinutes("");
      }}>
        <label className="c4-lab">
          <span>{v4("dtMinutes")}</span>
          <input className="c4-field" inputMode="numeric" aria-label={v4("dtMinutes")} value={minutes} onChange={(event) => setMinutes(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn">{v4("dtSet")}</button>
      </form>
      <p className="c4-meta">{v4("dtBlank")}</p>
      <div className="c4-row">
        <button type="button" className="c4-btn" onClick={() => store(timer.running ? pauseTimer(timer, Date.now()) : startTimer(timer, Date.now()))}>{timer.running ? v4("dtPause") : v4("dtStart")}</button>
        <button type="button" className="c4-btn" onClick={() => store(resetTimer(timer))}>{v4("dtReset")}</button>
      </div>
    </section>
  );
}

export function LicenseGlance({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ licenses?: License[] }>("/api/admin/licenses");
  const [nowMs] = useState(() => Date.now());
  const [hiddenKinds, setHiddenKinds] = useState<LicenseKind[]>([]);
  const [selected, setSelected] = useState("");
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows = (data.data?.licenses || []).map((row): GlanceRow | null => {
    const id = String(row.id || "").trim();
    if (!id) return null;
    return {
      id,
      label: `${row.regulator || ""} ${row.number || ""} ${row.entity || ""}`.trim() || id,
      status: row.status,
      expiresAt: row.expiresAt,
      active: row.active,
    };
  }).filter((row): row is GlanceRow => Boolean(row));
  const present = presentLicenses(rows, nowMs);
  const presentKey = present.join(",");
  useEffect(() => {
    if (data.loading || data.error) return;
    const next = readHiddenLicenses(readJson(LICENSE_KEY, []));
    setHiddenKinds(next);
    writeJson(LICENSE_KEY, next);
  }, [data.loading, data.error, presentKey]);
  const openKinds = visibleLicenses(present, hiddenKinds, false);
  const kind = activeLicense(selected, showHidden ? visibleLicenses(present, hiddenKinds, true) : openKinds);
  const chips = visibleLicenses(present, hiddenKinds, showHidden);
  const split = licenseSplit(rows, nowMs);
  const others = otherStatuses(rows);
  const shown = visibleLicenseRows(rows, kind, query, nowMs);

  function store(next: LicenseKind[], clear: string) {
    setHiddenKinds(next);
    writeJson(LICENSE_KEY, next);
    if (clear && activeLicense(selected, [clear])) setSelected("");
  }

  return (
    <section className="c4-license-glance" aria-label={v4("lcTitle")} data-license-glance="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("lcSub")}</p>
          <h2 className="c4-title">{v4("lcTitle")}</h2>
        </div>
        <p className="c4-meta">{chips.length}</p>
      </header>
      <p className="c4-meta">{v4("lcHint")}</p>
      <p className="c4-meta">{v4("lcLocal")}</p>
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "settings", { area: "licenses" })}>{v4("lcBoard")}</Link>
      </p>
      {data.loading && !rows.length && <p className="c4-meta">{v4("lcLoading")}</p>}
      {data.error && <p className="c4-meta">{v4("lcFailed")}</p>}
      {!data.loading && !data.error && !rows.length && <p className="c4-pay-empty">{v4("lcNone")}</p>}
      {!data.loading && !present.length && rows.length > 0 && <p className="c4-pay-empty">{v4("lcEmpty")}</p>}
      <p className="c4-meta" data-license-split="">{v4("lcActive")} {split.active} · {v4("lcExpired")} {split.expired}</p>
      {others.length > 0 && (
        <ul className="c4-license-other">
          {others.map((line) => (
            <li key={line.status} data-status={line.status}>
              <span>{v4("lcOther")}</span>
              <span>{line.status}</span>
              <span className="c4-meta">{line.count}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="c4-row" role="group" aria-label={v4("lcShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("lcShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("lcHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("lcTitle")}>
        <button type="button" className="c4-chip" data-on={kind ? "0" : "1"} aria-pressed={!kind} onClick={() => setSelected("")}>{v4("lcAll")}</button>
        {chips.map((item) => (
          <span key={item} className="c4-license-pair" data-kind={item}>
            <button type="button" className="c4-chip" data-on={kind === item ? "1" : "0"} aria-pressed={kind === item} onClick={() => setSelected(kind === item ? "" : item)}>{v4(KIND_LABEL[item])}</button>
            <button type="button" className="c4-btn" onClick={() => store(toggleLicense(hiddenKinds, item), showHidden ? "" : item)}>{showHidden ? v4("lcShow") : v4("lcHide")}</button>
          </span>
        ))}
      </div>
      <label className="c4-lab">
        <span>{v4("lcSearch")}</span>
        <input className="c4-field" aria-label={v4("lcSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && (kind || present.length > 0) && <p className="c4-pay-empty">{v4("lcEmpty")}</p>}
      <ul className="c4-license-rows">
        {shown.map((row) => (
          <li key={row.id} data-kind={licenseKind(row, nowMs)}>
            <p>{row.label}</p>
            <p className="c4-meta">{licenseKind(row, nowMs) === "expired" ? v4("lcExpired") : v4("lcActive")}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
