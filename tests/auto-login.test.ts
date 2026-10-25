/**
 * Auto-login links: same-host redirect, valid / expired / reused tokens.
 * Uses the local DATABASE_URL only (never a production database).
 * Run: npx tsx tests/auto-login.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
import { middleware } from "../src/middleware";
import { autoLoginOrigin, loginTokenCandidates } from "../src/lib/auto-login";
import { cookieDomainForHost } from "../src/lib/auth";

function loadLocalEnv() {
  if (process.env.DATABASE_URL) return;
  try {
    const text = readFileSync(new URL("../.env", import.meta.url), "utf8");
    for (const line of text.split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i < 1) continue;
      const k = t.slice(0, i).trim();
      let v = t.slice(i + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      if (!process.env[k]) process.env[k] = v;
    }
  } catch {
    /* no local env file */
  }
}

function headerReq(url: string, headers: Record<string, string>) {
  return { url, headers: { get: (n: string) => headers[n.toLowerCase()] ?? headers[n] ?? null } };
}

async function main() {
  const prevDomain = process.env.COOKIE_DOMAIN;
  process.env.COOKIE_DOMAIN = ".customer.org.tr";
  try {
    assert.equal(cookieDomainForHost("7fx.customer.org.tr"), ".customer.org.tr");
    assert.equal(cookieDomainForHost("crm7fx.customer.org.tr"), ".customer.org.tr");
    assert.equal(cookieDomainForHost("7fx.financeunit.co"), undefined);
    assert.equal(cookieDomainForHost("7fx.control.org.tr"), undefined);
    assert.equal(cookieDomainForHost("7fx.login.org.tr"), undefined);
  } finally {
    if (prevDomain === undefined) delete process.env.COOKIE_DOMAIN;
    else process.env.COOKIE_DOMAIN = prevDomain;
  }

  const prevApp = process.env.NEXT_PUBLIC_APP_URL;
  process.env.NEXT_PUBLIC_APP_URL = "https://7fx.customer.org.tr";
  try {
    assert.equal(
      autoLoginOrigin(
        headerReq("http://127.0.0.1:3456/api/auth/auto-login?token=abc", {
          host: "127.0.0.1:3456",
          "x-forwarded-proto": "http",
        })
      ),
      "http://127.0.0.1:3456"
    );
    for (const host of ["7fx.customer.org.tr", "7fx.financeunit.co", "7fx.control.org.tr", "7fx.login.org.tr"]) {
      assert.equal(
        autoLoginOrigin(
          headerReq(`http://0.0.0.0:8080/api/auth/auto-login?token=abc`, {
            host: "0.0.0.0:8080",
            "x-forwarded-host": host,
            "x-forwarded-proto": "https",
          })
        ),
        `https://${host}`
      );
    }
  } finally {
    if (prevApp === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = prevApp;
  }

  const plus = loginTokenCandidates("ab cd/ef");
  assert.ok(plus.includes("ab cd/ef"));
  assert.ok(plus.includes("ab+cd/ef"));

  const gmail = new NextRequest("https://7fx.login.org.tr/api/auth/auto-login?token=abc", {
    headers: {
      origin: "https://mail.google.com",
      host: "7fx.login.org.tr",
      "x-forwarded-proto": "https",
    },
  });
  const passed = middleware(gmail);
  assert.notEqual(passed.status, 403);

  const evil = new NextRequest("https://7fx.login.org.tr/api/orders", {
    method: "POST",
    headers: { origin: "https://evil.example", host: "7fx.login.org.tr" },
  });
  assert.equal(middleware(evil).status, 403);

  loadLocalEnv();
  const dbUrl = process.env.DATABASE_URL || "";
  if (!dbUrl) {
    console.log("auto-login unit checks ok (no local DATABASE_URL, skipped DB cases)");
    return;
  }
  if (!/localhost|127\.0\.0\.1/.test(dbUrl)) {
    throw new Error("Refusing to run auto-login DB tests against a non-local DATABASE_URL");
  }

  const prisma = new PrismaClient();
  const { GET } = await import("../src/app/api/auth/auto-login/route");
  const email = `auto-login-${Date.now()}@local.test`;
  const passwordHash = await bcrypt.hash("password123", 4);
  const user = await prisma.user.create({
    data: {
      email,
      name: "Auto Login Test",
      passwordHash,
      role: "TRADER",
      active: true,
      loginEnabled: true,
      account: { create: { balance: 0, equity: 0, currency: "USD" } },
    },
  });

  const reqFor = (token: string, headers: Record<string, string>, urlHost = "https://7fx.login.org.tr") =>
    new Request(`${urlHost}/api/auth/auto-login?token=${encodeURIComponent(token)}`, { headers });

  try {
    const valid = randomBytes(24).toString("hex");
    await prisma.autoLoginLink.create({
      data: {
        token: valid,
        userId: user.id,
        expiresAt: new Date(Date.now() + 60 * 60_000),
        maxUses: 0,
      },
    });
    const ok = await GET(
      reqFor(valid, { host: "7fx.login.org.tr", "x-forwarded-proto": "https" })
    );
    assert.equal(ok.status, 307);
    assert.equal(ok.headers.get("location"), "https://7fx.login.org.tr/trade");
    const cookie = ok.headers.get("set-cookie") || "";
    assert.match(cookie, /7fx_session=/);
    assert.doesNotMatch(cookie, /Domain=/i);

    const localTok = randomBytes(24).toString("hex");
    await prisma.autoLoginLink.create({
      data: { token: localTok, userId: user.id, expiresAt: new Date(Date.now() + 60 * 60_000), maxUses: 0 },
    });
    const local = await GET(
      reqFor(localTok, { host: "127.0.0.1:3456", "x-forwarded-proto": "http" }, "http://127.0.0.1:3456")
    );
    assert.equal(local.status, 307);
    assert.equal(local.headers.get("location"), "http://127.0.0.1:3456/trade");

    const expiredTok = randomBytes(24).toString("hex");
    await prisma.autoLoginLink.create({
      data: { token: expiredTok, userId: user.id, expiresAt: new Date(Date.now() - 5_000), maxUses: 0 },
    });
    const expired = await GET(
      reqFor(expiredTok, { host: "7fx.financeunit.co", "x-forwarded-proto": "https" }, "https://7fx.financeunit.co")
    );
    assert.equal(expired.status, 307);
    const expiredLoc = expired.headers.get("location") || "";
    assert.match(expiredLoc, /^https:\/\/7fx\.financeunit\.co\/login\?error=/);
    assert.match(decodeURIComponent(expiredLoc), /expired/i);
    assert.equal(expired.headers.get("set-cookie"), null);

    const once = randomBytes(24).toString("hex");
    await prisma.autoLoginLink.create({
      data: {
        token: once,
        userId: user.id,
        expiresAt: new Date(Date.now() + 60 * 60_000),
        maxUses: 1,
      },
    });
    const headers = { host: "7fx.control.org.tr", "x-forwarded-proto": "https" };
    const first = await GET(reqFor(once, headers, "https://7fx.control.org.tr"));
    assert.equal(first.status, 307);
    assert.equal(first.headers.get("location"), "https://7fx.control.org.tr/trade");
    const reused = await GET(reqFor(once, headers, "https://7fx.control.org.tr"));
    assert.equal(reused.status, 307);
    const reusedLoc = reused.headers.get("location") || "";
    assert.match(reusedLoc, /^https:\/\/7fx\.control\.org\.tr\/login\?error=/);
    assert.match(decodeURIComponent(reusedLoc), /already used/i);
    assert.equal(reused.headers.get("set-cookie"), null);

    console.log("auto-login tests ok");
  } finally {
    await prisma.autoLoginLink.deleteMany({ where: { userId: user.id } });
    await prisma.loginEvent.deleteMany({ where: { userId: user.id } });
    await prisma.account.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
