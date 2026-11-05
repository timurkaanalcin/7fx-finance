"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
import type { CrmV3CopyKey } from "@/lib/crmv3/copy";
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
} from "@/lib/crmv3/timer";
import { crmv3Href } from "@/lib/crmv3/sections";
import { useJson } from "../kit";
import { useV3 } from "./store";

const MODE_LABEL: Record<TimerMode, CrmV3CopyKey> = {
  stopwatch: "dtStopwatch",
  countdown: "dtCountdown",
};

const KIND_LABEL: Record<LicenseKind, CrmV3CopyKey> = {
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

export function DeskTimer() {
  const v3 = useV3();
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
    <section className="c3-desk-timer" aria-label={v3("dtTitle")} data-desk-timer="1" data-running={timer.running ? "1" : "0"} data-mode={timer.mode}>
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("dtSub")}</p>
          <h2 className="c3-title">{v3("dtTitle")}</h2>
        </div>
        <p className="c3-timer-face">{formatClock(showMs(timer, now))}</p>
      </header>
      <p className="c3-muted">{v3("dtHint")}</p>
      <p className="c3-muted">{v3("dtLocal")}</p>
      <p className="c3-muted">{v3("dtNoServer")}</p>
      <div className="c3-row" role="group" aria-label={v3("dtTitle")}>
        {(["stopwatch", "countdown"] as const).map((mode) => (
          <button key={mode} type="button" className="c3-chip" data-on={timer.mode === mode ? "1" : "0"} aria-pressed={timer.mode === mode} onClick={() => store(chooseMode(timer, mode))}>
            {v3(MODE_LABEL[mode])}
          </button>
        ))}
      </div>
      <form className="c3-row" onSubmit={(event) => {
        event.preventDefault();
        const next = setCountdownMinutes(timer, minutes);
        if (next === timer) return;
        store(next);
        setMinutes("");
      }}>
        <label className="c3-lab">
          <span>{v3("dtMinutes")}</span>
          <input className="c3-field" inputMode="numeric" aria-label={v3("dtMinutes")} value={minutes} onChange={(event) => setMinutes(event.target.value)} />
        </label>
        <button type="submit" className="c3-btn">{v3("dtSet")}</button>
      </form>
      <p className="c3-muted">{v3("dtBlank")}</p>
      <div className="c3-row">
        <button type="button" className="c3-btn" onClick={() => store(timer.running ? pauseTimer(timer, Date.now()) : startTimer(timer, Date.now()))}>{timer.running ? v3("dtPause") : v3("dtStart")}</button>
        <button type="button" className="c3-btn" onClick={() => store(resetTimer(timer))}>{v3("dtReset")}</button>
      </div>
    </section>
  );
}

export function LicenseGlance({ base }: { base: string }) {
  const v3 = useV3();
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
    <section className="c3-license-glance" aria-label={v3("lcTitle")} data-license-glance="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("lcSub")}</p>
          <h2 className="c3-title">{v3("lcTitle")}</h2>
        </div>
        <p className="c3-muted">{chips.length}</p>
      </header>
      <p className="c3-muted">{v3("lcHint")}</p>
      <p className="c3-muted">{v3("lcLocal")}</p>
      <p className="c3-row">
        <Link className="c3-btn" href={crmv3Href(base, "settings", { area: "licenses" })}>{v3("lcBoard")}</Link>
      </p>
      {data.loading && !rows.length && <p className="c3-muted">{v3("lcLoading")}</p>}
      {data.error && <p className="c3-muted">{v3("lcFailed")}</p>}
      {!data.loading && !data.error && !rows.length && <p className="c3-empty">{v3("lcNone")}</p>}
      {!data.loading && !present.length && rows.length > 0 && <p className="c3-empty">{v3("lcEmpty")}</p>}
      <p className="c3-muted" data-license-split="">{v3("lcActive")} {split.active} · {v3("lcExpired")} {split.expired}</p>
      {others.length > 0 && (
        <ul className="c3-license-other">
          {others.map((line) => (
            <li key={line.status} data-status={line.status}>
              <span>{v3("lcOther")}</span>
              <span>{line.status}</span>
              <span className="c3-muted">{line.count}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="c3-row" role="group" aria-label={v3("lcShown")}>
        <button type="button" className="c3-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v3("lcShown")}</button>
        <button type="button" className="c3-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v3("lcHidden")}</button>
      </div>
      <div className="c3-row" role="group" aria-label={v3("lcTitle")}>
        <button type="button" className="c3-chip" data-on={kind ? "0" : "1"} aria-pressed={!kind} onClick={() => setSelected("")}>{v3("lcAll")}</button>
        {chips.map((item) => (
          <span key={item} className="c3-license-pair" data-kind={item}>
            <button type="button" className="c3-chip" data-on={kind === item ? "1" : "0"} aria-pressed={kind === item} onClick={() => setSelected(kind === item ? "" : item)}>{v3(KIND_LABEL[item])}</button>
            <button type="button" className="c3-btn" onClick={() => store(toggleLicense(hiddenKinds, item), showHidden ? "" : item)}>{showHidden ? v3("lcShow") : v3("lcHide")}</button>
          </span>
        ))}
      </div>
      <label className="c3-lab">
        <span>{v3("lcSearch")}</span>
        <input className="c3-field" aria-label={v3("lcSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && (kind || present.length > 0) && <p className="c3-empty">{v3("lcEmpty")}</p>}
      <ul className="c3-license-rows">
        {shown.map((row) => (
          <li key={row.id} data-kind={licenseKind(row, nowMs)}>
            <p>{row.label}</p>
            <p className="c3-muted">{licenseKind(row, nowMs) === "expired" ? v3("lcExpired") : v3("lcActive")}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
