/**
 * Declared vs detected traffic source.
 * Run: npx tsx tests/lead-origin.test.ts
 */
import assert from "node:assert/strict";
import {
  computeFraudFlag,
  detectTrafficSource,
  normalizeSource,
  requestIpAllowed,
  sourcesMismatch,
} from "../src/lib/lead-origin";
import { affiliateSourceName, buildAffiliateReport } from "../src/lib/affiliate-report";
import { DEFAULT_LEAD_STATUS_MAPPING } from "../src/lib/lead-status";

function main() {
  assert.equal(normalizeSource("Google Ads"), "google");
  assert.equal(normalizeSource("FB"), "facebook");
  assert.equal(normalizeSource("ig"), "instagram");
  assert.equal(normalizeSource(""), "unknown");
  assert.equal(normalizeSource("taboola"), "taboola");

  const fb = detectTrafficSource({ fbclid: "IwAR123", utmSource: "google", browser: true });
  assert.equal(fb.source, "facebook");
  assert.equal(fb.via, "click-id");

  const ig = detectTrafficSource({
    fbclid: "IwAR123",
    userAgent: "Mozilla/5.0 Instagram 300.0.0.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit FBAN/FBIOS",
  });
  assert.equal(ig.source, "instagram");
  assert.equal(ig.inApp, "instagram");

  const fban = detectTrafficSource({ userAgent: "Mozilla/5.0 FBAN/FBIOS FBAV/400" });
  assert.equal(fban.source, "facebook");

  const google = detectTrafficSource({ gclid: "Cj0KCQ", landingUrl: "https://land.example/?utm_source=taboola" });
  assert.equal(google.source, "google");

  const tt = detectTrafficSource({ ttclid: "E.C.P" });
  assert.equal(tt.source, "tiktok");

  const ref = detectTrafficSource({ referrer: "https://l.facebook.com/l.php", browser: true });
  assert.equal(ref.source, "facebook");
  assert.equal(ref.via, "referrer");

  const taboolaUtm = detectTrafficSource({ utmSource: "taboola", browser: true });
  assert.equal(taboolaUtm.source, "taboola");

  const direct = detectTrafficSource({ browser: true, referrer: "" });
  assert.equal(direct.source, "direct");

  const emptyApi = detectTrafficSource({ browser: false });
  assert.equal(emptyApi.source, "unknown");

  assert.equal(sourcesMismatch("google", "facebook"), true);
  assert.equal(sourcesMismatch("Google Ads", "google"), false);
  assert.equal(sourcesMismatch("taboola", "facebook"), true);
  assert.equal(sourcesMismatch("google", "unknown"), false);
  assert.equal(sourcesMismatch("google", "direct"), true);
  assert.equal(sourcesMismatch(null, "facebook"), false);

  assert.equal(
    computeFraudFlag({ checkOnFraud: true, allowedSources: "google, taboola", detected: "facebook", mismatch: true }),
    true
  );
  assert.equal(
    computeFraudFlag({ checkOnFraud: false, allowedSources: "google", detected: "facebook", mismatch: true }),
    false
  );
  assert.equal(requestIpAllowed("203.0.113.8", "203.0.113.8, 198.51.100.2"), true);
  assert.equal(requestIpAllowed("203.0.113.9", "203.0.113.8"), false);
  assert.equal(requestIpAllowed("203.0.113.9", ""), true);

  assert.equal(affiliateSourceName({ affiliateA: "", affiliateB: "taboola", campaign: "x" }), "taboola");
  assert.equal(affiliateSourceName({}), "—");

  const now = Date.UTC(2026, 10, 1);
  const report = buildAffiliateReport({
    now,
    period: "month",
    mapping: DEFAULT_LEAD_STATUS_MAPPING,
    origins: new Map([
      ["l1", { declaredSource: "google", detectedSource: "facebook", mismatch: true }],
      ["l2", { declaredSource: "google", detectedSource: "google", mismatch: false }],
    ]),
    users: [
      {
        id: "l1",
        name: "A",
        email: "a@aff.ca",
        createdAt: new Date(now - 2 * 86400000),
        affiliateA: "aff CA",
        affiliateB: null,
        affiliateC: null,
        campaign: null,
        saleStatus: "NEW",
        leadInvalid: false,
        leadInvalidReason: null,
        ftd: true,
        deposits: 1,
      },
      {
        id: "l2",
        name: "B",
        email: "b@aff.ca",
        createdAt: new Date(now - 3 * 86400000),
        affiliateA: "aff CA",
        affiliateB: null,
        affiliateC: null,
        campaign: null,
        saleStatus: "INV_WRONG_SOURCE",
        leadInvalid: false,
        leadInvalidReason: null,
        ftd: false,
        deposits: 0,
      },
      {
        id: "l3",
        name: "Old",
        email: "old@aff.ca",
        createdAt: new Date(now - 400 * 86400000),
        affiliateA: "aff CA",
        affiliateB: null,
        affiliateC: null,
        campaign: null,
        saleStatus: "NEW",
        leadInvalid: false,
        leadInvalidReason: null,
        ftd: false,
        deposits: 0,
      },
    ],
    capture: "aff CA",
  });
  const row = report.rows.find((r) => r.name === "aff CA");
  assert.ok(row);
  assert.equal(row!.leads, 2);
  assert.equal(row!.valid, 1);
  assert.equal(row!.invalid, 1);
  assert.equal(row!.deposits, 1);
  assert.equal(row!.ftd, 1);
  assert.equal(row!.mismatch, 1);
  assert.equal(row!.tracked, 2);
  assert.equal(row!.year, 2);
  assert.equal(report.captured.length, 2);
  assert.equal(report.captured[0].invalid || report.captured[1].invalid, true);

  console.log("lead-origin tests passed");
}

main();
