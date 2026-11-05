/**
 * CRM v3 desk timer and license glance.
 * Run: npx tsx tests/crmv3-round84.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { DT_AR, DT_DE, DT_EN, DT_RU, DT_TR } from "../src/lib/crmv3/copy-timer";
import { crmv3Text } from "../src/lib/crmv3/copy";
import { catalogLocalesComplete, keyTitle } from "../src/lib/crmv3/insights";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
import { CRM_V3_MORE, CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";
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
  readTimer,
  resetTimer,
  setCountdownMinutes,
  showMs,
  startTimer,
  toggleLicense,
  visibleLicenseRows,
  visibleLicenses,
} from "../src/lib/crmv3/timer";

const ROOT = path.resolve(__dirname, "..");

function main() {
  assert.equal(TIMER_KEY, "crmv3-desk-timer");
  assert.equal(LICENSE_KEY, "crmv3-license-hide");
  const now = Date.parse("2026-11-05T12:00:00Z");
  assert.equal(setCountdownMinutes(EMPTY_TIMER, "").countdownMs, 0);
  assert.equal(setCountdownMinutes(EMPTY_TIMER, "0").countdownMs, 0);
  assert.equal(setCountdownMinutes(EMPTY_TIMER, "nope").countdownMs, 0);
  const countdown = setCountdownMinutes(EMPTY_TIMER, "2");
  assert.equal(countdown.mode, "countdown");
  assert.equal(countdown.countdownMs, 120_000);
  const running = startTimer(EMPTY_TIMER, now);
  assert.equal(running.running, true);
  assert.equal(showMs(running, now + 1500), 1500);
  const paused = pauseTimer(running, now + 1500);
  assert.equal(paused.running, false);
  assert.equal(paused.elapsedMs, 1500);
  assert.equal(resetTimer(paused).elapsedMs, 0);
  assert.equal(startTimer(countdown, now).running, true);
  assert.equal(startTimer({ ...countdown, countdownMs: 0 }, now).running, false);
  assert.equal(formatClock(65_000), "01:05");
  assert.equal(chooseMode(running, "countdown").running, false);
  const saved = readTimer({ mode: "stopwatch", running: true, startedAt: now, elapsedMs: 1000, countdownMs: 0 });
  assert.equal(showMs(saved, now + 2000), 3000);

  const rows = [
    { id: "a", label: "FCA 1", active: true },
    { id: "b", label: "FCA 2", active: false },
    { id: "c", label: "Old", status: "EXPIRED", expiresAt: "2026-12-01T00:00:00Z" },
    { id: "d", label: "Dated", expiresAt: "2026-11-01T00:00:00Z" },
    { id: "e", label: "Future", expiresAt: "2026-12-01T00:00:00Z" },
    { id: "f", label: "Bad", expiresAt: "not-a-date", active: false },
    { id: "g", label: "Hold", status: "PENDING" },
    { id: "h", label: "Live", status: "ACTIVE" },
  ];
  assert.equal(licenseKind(rows[0], now), "active");
  assert.equal(licenseKind(rows[1], now), "");
  assert.equal(licenseKind(rows[2], now), "expired");
  assert.equal(licenseKind(rows[3], now), "expired");
  assert.equal(licenseKind(rows[4], now), "");
  assert.equal(licenseKind(rows[5], now), "");
  assert.equal(licenseKind(rows[6], now), "");
  assert.equal(licenseKind(rows[7], now), "active");
  assert.deepEqual(licenseSplit(rows, now), { active: 2, expired: 2 });
  assert.deepEqual(otherStatuses(rows), [{ status: "PENDING", count: 1 }]);
  assert.deepEqual(presentLicenses(rows, now), ["active", "expired"]);
  assert.deepEqual(visibleLicenseRows(rows, "expired", "old", now).map((row) => row.id), ["c"]);
  assert.equal(visibleLicenseRows(rows, "active", "", now).some((row) => row.id === "b"), false);
  assert.deepEqual(visibleLicenses(["active", "expired"], ["expired"], false), ["active"]);
  assert.equal(activeLicense("expired", ["active"]), "");
  assert.deepEqual(toggleLicense(["active"], "nope"), ["active"]);

  const copy = Object.keys(DT_EN).sort();
  assert.deepEqual(Object.keys(DT_TR).sort(), copy);
  assert.deepEqual(Object.keys(DT_DE).sort(), copy);
  assert.deepEqual(Object.keys(DT_RU).sort(), copy);
  assert.deepEqual(Object.keys(DT_AR).sort(), copy);
  assert.notEqual(DT_TR.dtTitle, DT_EN.dtTitle);
  assert.notEqual(DT_DE.lcHint, DT_EN.lcHint);
  assert.notEqual(DT_RU.lcExpired, DT_EN.lcExpired);
  assert.notEqual(DT_AR.dtBlank, DT_EN.dtBlank);
  assert.equal(crmv3Text("en", "dtTitle"), "Desk timer");
  assert.equal(crmv3Text("tr", "lcTitle"), DT_TR.lcTitle);
  assert.equal(catalogLocalesComplete(), true);
  assert.equal(keyTitle("crmv3-desk-timer", "de"), "Tischuhr");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "desktimer"), true);
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "licglance"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("desktimer"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("licglance"), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "desk" && (group.ids as readonly string[]).includes("desktimer")), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "desk" && (group.ids as readonly string[]).includes("licglance")), true);

  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-desk-timer/);
  assert.match(css, /\.c3-license-glance/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/timer.tsx"), "utf8");
  const glance = view.slice(view.indexOf("export function LicenseGlance"));
  assert.equal(view.includes("crmv4"), false);
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("serverTime"), false);
  assert.equal(glance.includes("setInterval"), false);
  assert.equal(glance.includes("sendJson"), false);
  assert.match(view, /\/api\/admin\/licenses/);
  assert.match(view, /TIMER_KEY/);
  assert.match(view, /data-desk-timer/);
  assert.match(view, /data-license-glance/);
  const app = fs.readFileSync(path.join(ROOT, "src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "desktimer"/);
  assert.match(app, /view === "licglance"/);
  assert.equal(app.includes("/api/notifications"), false);
  console.log("crmv3 round84 tests passed");
}

main();
