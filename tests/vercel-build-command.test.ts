/**
 * Vercel must run the npm build so the deferred CSS files are published.
 * Run: npx tsx tests/vercel-build-command.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function main() {
  const vercel = JSON.parse(read("vercel.json"));
  assert.equal(vercel.buildCommand, "npm run build");
  assert.notEqual(vercel.buildCommand, "prisma generate && next build");

  const pkg = JSON.parse(read("package.json"));
  assert.match(pkg.scripts.build, /prisma generate/);
  assert.match(pkg.scripts.build, /next build/);
  assert.match(pkg.scripts.build, /scripts\/publish-deferred-css\.mjs/);

  const ignore = read(".vercelignore");
  assert.match(ignore, /^node_modules$/m);
  assert.match(ignore, /^\.next$/m);
  assert.match(ignore, /^\.env\*$/m);

  const doc = read("docs/DEPLOY.md");
  assert.match(doc, /copy of the tree that has no `\.git` directory/);
  assert.match(doc, /Hobby blocks a git deployment/);
  assert.match(doc, /dpl_Z5Wgvb247KcqbX9QncEYpamENfr1/);
  assert.match(doc, /vercel alias set 7fx-finance-3ajnsb205-llvad-1323\.vercel\.app 7fx\.customer\.org\.tr/);
  assert.match(doc, /vercel alias set <previous-deployment-url-or-id> 7fx\.customer\.org\.tr/);
  assert.match(read("scripts/publish-deferred-css.mjs"), /fx-public-utilities\.css/);
  assert.match(read("scripts/publish-deferred-css.mjs"), /fx-landing\.css/);

  console.log("vercel build command tests passed");
}

main();
