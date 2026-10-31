/**
 * CRM v4 round 9 helpers.
 * Run: npx tsx tests/crmv4-round9.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fillReply, firstResponseAge, noteTokens, onboardingStage, responseMinutes, workStreak } from "../src/lib/crmv4/round9";

function main() {
  const tokens = noteTokens("**Hi**\n- one\n[site](https://example.com)\n[shot](https://cdn.example/a.png)");
  assert.equal(tokens.some((token) => token.type === "bold"), true);
  assert.equal(tokens.some((token) => token.type === "item"), true);
  assert.equal(tokens.some((token) => token.type === "link"), true);
  assert.equal(tokens.some((token) => token.type === "image"), true);
  assert.equal(noteTokens("<b>x</b>")[0].type, "text");
  assert.equal(fillReply("Hi {{customer}}", { customer: "Ada" }), "Hi Ada");
  const minutes = responseMinutes([
    { createdAt: "2026-10-30T10:00:00Z" },
    { workerId: "w", createdAt: "2026-10-30T10:05:00Z" },
  ]);
  assert.equal(minutes, 5);
  assert.equal(firstResponseAge("2026-10-30T10:00:00Z", new Date("2026-10-30T11:30:00Z").getTime()), "1h 30m");
  assert.equal(workStreak(["2026-10-30", "2026-10-29"], "2026-10-30"), 2);
  assert.equal(onboardingStage({ phone: "1" }), "kyc");
  assert.equal(onboardingStage({ ftd: true }), "live");
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-chat-luxe/);
  assert.match(css, /\.c4-kyc-luxe/);
  assert.match(css, /\.c4-myday/);
  console.log("crmv4 round9 tests passed");
}

main();
