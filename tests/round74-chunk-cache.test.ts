/**
 * The push service worker must not keep HTML or Next chunks, and a missing
 * chunk shows a reload prompt instead of a blank page.
 * Run: npx tsx tests/round74-chunk-cache.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { isChunkLoadError } from "../src/lib/chunk-reload";

const ROOT = path.resolve(__dirname, "..");

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function main() {
  assert.equal(isChunkLoadError({ name: "ChunkLoadError", message: "Loading chunk 918 failed." }), true);
  assert.equal(isChunkLoadError("Loading CSS chunk 12 failed"), true);
  assert.equal(isChunkLoadError(new Error("Failed to fetch dynamically imported module")), true);
  assert.equal(isChunkLoadError(new Error("deposit failed")), false);
  assert.equal(isChunkLoadError(null), false);

  const sw = read("public/sw.js");
  assert.match(sw, /const VERSION = "2026-10-30-v6-mono"/);
  assert.equal(sw.includes("2026-10-24-v4-offline"), false);
  assert.equal(sw.includes("caches.put"), false);
  assert.match(sw, /keys\.filter\(\(k\) => k !== CACHE\)/);
  assert.match(sw, /caches\.delete\(k\)/);
  assert.match(sw, /path\.startsWith\("\/_next\/"\)/);
  assert.match(sw, /cache: "no-store"/);
  const fetchAt = sw.indexOf('self.addEventListener("fetch"');
  const navAt = sw.indexOf('req.mode === "navigate"', fetchAt);
  const nextAt = sw.indexOf('url.pathname.startsWith("/_next/")', fetchAt);
  assert.ok(fetchAt > 0 && navAt > fetchAt && nextAt > navAt);
  const navBlock = sw.slice(navAt, nextAt);
  assert.match(navBlock, /cache: "no-store"/);
  assert.equal(navBlock.includes("caches.put"), false);
  assert.equal(navBlock.includes("caches.match"), false);
  const precache = sw.slice(sw.indexOf("const PRECACHE"), sw.indexOf("];"));
  assert.equal(precache.includes('"/_next'), false);
  assert.equal(precache.includes('"/login"'), false);
  assert.equal(precache.includes('"/trade"'), false);
  assert.equal(precache.includes('"/"'), false);
  assert.match(precache, /OFFLINE_URL/);
  assert.match(sw, /addEventListener\("push"/);

  const layout = read("src/app/layout.tsx");
  assert.match(layout, /id="fx-chunk-reload"/);
  assert.match(layout, /ChunkLoadError/);
  assert.match(layout, /location\.reload\(\)/);
  assert.match(layout, /updateViaCache:'none'/);

  const fallback = read("src/components/system/ErrorFallback.tsx");
  assert.match(fallback, /isChunkLoadError\(error\)/);
  assert.match(fallback, /gap\.err\.reload/);
  assert.match(fallback, /window\.location\.reload\(\)/);
  assert.match(fallback, /code="500"/);
  assert.equal(fallback.includes("fontWeight: 700"), false);

  for (const loc of ["en", "tr", "de", "ru", "ar"]) {
    const src = read(`src/lib/i18n/dictionaries/${loc}.ts`);
    assert.match(src, /"gap\.err\.chunkTitle": "/);
    assert.match(src, /"gap\.err\.chunkBody": "/);
    assert.match(src, /"gap\.err\.reload": "/);
  }
  assert.match(read("src/lib/i18n/dictionaries/en.ts"), /"gap\.err\.chunkTitle": "This page is out of date"/);
  assert.match(read("src/lib/i18n/dictionaries/en.ts"), /"gap\.err\.reload": "Reload"/);

  const login = read("src/components/auth/LoginForm.tsx");
  assert.match(login, /id="fx-login-identifier"[\s\S]*?readOnly=\{loading\}/);
  assert.match(login, /id="fx-login-password"[\s\S]*?readOnly=\{loading\}/);
  assert.match(read("tests/source-account-optional.test.ts"), /doesNotMatch\(dict, \/Source account: required\|Kaynak hesap: zorunlu\/\)/);

  console.log("round74 chunk cache tests passed");
}

main();
