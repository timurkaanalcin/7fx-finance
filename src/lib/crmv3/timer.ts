/** A local desk timer, and active versus expired counts from loaded license rows. */

export const TIMER_KEY = "crmv3-desk-timer";
export const LICENSE_KEY = "crmv3-license-hide";

export const TIMER_MODES = ["stopwatch", "countdown"] as const;
export type TimerMode = (typeof TIMER_MODES)[number];

export const LICENSE_KINDS = ["active", "expired"] as const;
export type LicenseKind = (typeof LICENSE_KINDS)[number];

export type TimerState = {
  mode: TimerMode;
  running: boolean;
  startedAt: number | null;
  elapsedMs: number;
  countdownMs: number;
};

export type LicenseInput = {
  status?: string | null;
  expiresAt?: string | null;
  active?: boolean | null;
  label?: string | null;
};

export type LicenseSplit = { active: number; expired: number };

export type OtherLine = { status: string; count: number };

export const EMPTY_TIMER: TimerState = {
  mode: "stopwatch",
  running: false,
  startedAt: null,
  elapsedMs: 0,
  countdownMs: 0,
};

function clampMs(value: number, max: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.min(value, max);
}

export function readTimer(raw: unknown): TimerState {
  if (!raw || typeof raw !== "object") return { ...EMPTY_TIMER };
  const row = raw as Partial<TimerState>;
  const started = row.startedAt == null ? null : Number(row.startedAt);
  const startedAt = started != null && Number.isFinite(started) ? started : null;
  return {
    mode: row.mode === "countdown" ? "countdown" : "stopwatch",
    running: row.running === true && startedAt != null,
    startedAt,
    elapsedMs: clampMs(Number(row.elapsedMs), 86_400_000),
    countdownMs: clampMs(Number(row.countdownMs), 720 * 60_000),
  };
}

export function runMs(state: TimerState, nowMs: number): number {
  const live = state.running && state.startedAt != null ? Math.max(0, nowMs - state.startedAt) : 0;
  return state.elapsedMs + live;
}

export function showMs(state: TimerState, nowMs: number): number {
  const run = runMs(state, nowMs);
  if (state.mode === "countdown") return Math.max(0, state.countdownMs - run);
  return run;
}

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}

export function chooseMode(state: TimerState, mode: string): TimerState {
  const next: TimerMode | "" = mode === "countdown" ? "countdown" : mode === "stopwatch" ? "stopwatch" : "";
  if (!next || next === state.mode) return state;
  return { ...state, mode: next, running: false, startedAt: null, elapsedMs: 0 };
}

/** A blank, zero, or non-numeric length is left out. A running timer is not changed. */
export function setCountdownMinutes(state: TimerState, raw: string): TimerState {
  if (state.running) return state;
  const text = String(raw || "").trim();
  if (!/^\d+$/.test(text)) return state;
  const minutes = Number(text);
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 720) return state;
  return { ...state, mode: "countdown", countdownMs: minutes * 60_000, elapsedMs: 0, startedAt: null, running: false };
}

export function startTimer(state: TimerState, nowMs: number): TimerState {
  if (state.running) return state;
  if (state.mode === "countdown" && showMs(state, nowMs) <= 0) return state;
  return { ...state, running: true, startedAt: nowMs };
}

export function pauseTimer(state: TimerState, nowMs: number): TimerState {
  if (!state.running || state.startedAt == null) return { ...state, running: false, startedAt: null };
  return { ...state, running: false, startedAt: null, elapsedMs: clampMs(state.elapsedMs + Math.max(0, nowMs - state.startedAt), 86_400_000) };
}

export function resetTimer(state: TimerState): TimerState {
  return { ...state, running: false, startedAt: null, elapsedMs: 0 };
}

/** Active or expired only when a status or a real date says so. A missing date is not expired. */
export function licenseKind(row: LicenseInput, nowMs: number): LicenseKind | "" {
  const status = String(row.status || "").trim().toUpperCase();
  if (status === "EXPIRED") return "expired";
  if (status === "ACTIVE") return "active";
  if (status) return "";
  const dateText = String(row.expiresAt ?? "").trim();
  if (dateText) {
    const ms = Date.parse(dateText);
    if (!Number.isFinite(ms)) return "";
    return ms <= nowMs ? "expired" : "";
  }
  if (row.active === true) return "active";
  return "";
}

export function rawStatus(row: LicenseInput): string {
  return String(row.status || "").trim().toUpperCase();
}

export function licenseSplit(rows: readonly LicenseInput[], nowMs: number): LicenseSplit {
  let active = 0;
  let expired = 0;
  for (const row of rows) {
    const kind = licenseKind(row, nowMs);
    if (kind === "active") active += 1;
    else if (kind === "expired") expired += 1;
  }
  return { active, expired };
}

export function otherStatuses(rows: readonly LicenseInput[]): OtherLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const status = rawStatus(row);
    if (!status || status === "ACTIVE" || status === "EXPIRED") continue;
    map.set(status, (map.get(status) || 0) + 1);
  }
  const out: OtherLine[] = [];
  map.forEach((count, status) => out.push({ status, count }));
  return out.sort((a, b) => a.status.localeCompare(b.status));
}

export function presentLicenses(rows: readonly LicenseInput[], nowMs: number): LicenseKind[] {
  const split = licenseSplit(rows, nowMs);
  const out: LicenseKind[] = [];
  if (split.active > 0) out.push("active");
  if (split.expired > 0) out.push("expired");
  return out;
}

export function readHiddenLicenses(raw: unknown): LicenseKind[] {
  if (!Array.isArray(raw)) return [];
  const out: LicenseKind[] = [];
  for (const item of raw) {
    const value = String(item || "").trim().toLowerCase();
    const kind: LicenseKind | "" = value === "active" ? "active" : value === "expired" ? "expired" : "";
    if (kind && !out.includes(kind)) out.push(kind);
  }
  return out;
}

export function toggleLicense(hidden: readonly string[], kind: string): LicenseKind[] {
  const current = readHiddenLicenses(hidden);
  const value = String(kind || "").trim().toLowerCase();
  const next: LicenseKind | "" = value === "active" ? "active" : value === "expired" ? "expired" : "";
  if (!next) return current;
  return current.includes(next) ? current.filter((item) => item !== next) : [...current, next];
}

export function visibleLicenses(present: readonly string[], hidden: readonly string[], showHidden: boolean): LicenseKind[] {
  const gone = new Set(readHiddenLicenses(hidden));
  const known = present.filter((item): item is LicenseKind => item === "active" || item === "expired");
  return known.filter((kind) => (showHidden ? gone.has(kind) : !gone.has(kind)));
}

export function activeLicense(selected: string, visible: readonly string[]): LicenseKind | "" {
  const value = String(selected || "").trim().toLowerCase();
  const kind: LicenseKind | "" = value === "active" ? "active" : value === "expired" ? "expired" : "";
  if (!kind) return "";
  return visible.includes(kind) ? kind : "";
}

export function visibleLicenseRows<T extends LicenseInput>(rows: readonly T[], kind: string, query: string, nowMs: number): T[] {
  const want = kind === "active" || kind === "expired" ? kind : "";
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const got = licenseKind(row, nowMs);
    if (!got) return false;
    if (want && got !== want) return false;
    if (!text) return true;
    return String(row.label || "").toLowerCase().includes(text);
  });
}
