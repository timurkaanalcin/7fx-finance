/**
 * Engine cron auth, account selection, and the time budget.
 * The database run itself needs MySQL; see the PR manual verification section.
 * Run: npx tsx tests/engine-cron.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { cronAuthorization } from "../src/lib/cron-auth";
import {
  ENGINE_CRON_BUDGET_MS,
  ENGINE_CRON_ROTATE_MS,
  engineUserIds,
  rotateIds,
  runEngineBatch,
} from "../src/lib/engine-schedule";

function readSrc(rel: string): string {
  return fs.readFileSync(path.join(__dirname, "..", rel), "utf8");
}

async function main() {
  assert.equal(cronAuthorization(undefined, "Bearer secret"), "unset");
  assert.equal(cronAuthorization("", "Bearer secret"), "unset");
  assert.equal(cronAuthorization("secret", null), "forbidden");
  assert.equal(cronAuthorization("secret", "Bearer other"), "forbidden");
  assert.equal(cronAuthorization("secret", "secret"), "forbidden");
  assert.equal(cronAuthorization("secret", "Bearer secret-extra"), "forbidden");
  assert.equal(cronAuthorization("secret", "Bearer secret"), "ok");

  assert.deepEqual(engineUserIds(["b", "a", "b"], ["c", "a"]), ["a", "b", "c"]);
  assert.deepEqual(engineUserIds([], []), []);

  assert.deepEqual(rotateIds(["a", "b", "c"], 0), ["a", "b", "c"]);
  assert.deepEqual(rotateIds(["a", "b", "c"], ENGINE_CRON_ROTATE_MS), ["b", "c", "a"]);
  assert.deepEqual(rotateIds(["a", "b", "c"], ENGINE_CRON_ROTATE_MS * 2), ["c", "a", "b"]);
  assert.deepEqual(rotateIds(["a", "b", "c"], ENGINE_CRON_ROTATE_MS * 3), ["a", "b", "c"]);
  assert.deepEqual(rotateIds([], 60_000), []);

  let clock = 1_000;
  const seen: string[] = [];
  const all = await runEngineBatch({
    ids: ["a", "b"],
    budgetMs: 50,
    startedMs: clock,
    now: () => clock,
    runUser: async (id) => {
      seen.push(id);
      clock += 10;
    },
  });
  assert.deepEqual(seen, ["a", "b"]);
  assert.deepEqual(all, { processed: 2, remaining: 0, timedOut: false, errors: 0 });

  clock = 5_000;
  const partial: string[] = [];
  const stopped = await runEngineBatch({
    ids: ["a", "b", "c"],
    budgetMs: 100,
    startedMs: clock,
    now: () => clock,
    runUser: async (id) => {
      partial.push(id);
      clock += 60;
    },
  });
  assert.deepEqual(partial, ["a", "b"]);
  assert.deepEqual(stopped, { processed: 2, remaining: 1, timedOut: true, errors: 0 });

  const failed = await runEngineBatch({
    ids: ["bad", "good"],
    budgetMs: 1_000,
    startedMs: 0,
    now: () => 0,
    runUser: async (id) => {
      if (id === "bad") throw new Error("Price yok");
    },
  });
  assert.deepEqual(failed, { processed: 2, remaining: 0, timedOut: false, errors: 1 });

  assert.equal(ENGINE_CRON_BUDGET_MS, 20_000);
  assert.ok(ENGINE_CRON_BUDGET_MS < 60_000);

  const route = readSrc("src/app/api/cron/engine/route.ts");
  assert.equal(route.includes("requireUser"), false);
  assert.match(route, /cronAuthorization\(process\.env\.CRON_SECRET/);
  assert.match(route, /CRON_SECRET is not configured/);
  assert.match(route, /status: 503/);
  assert.match(route, /status: 401/);
  assert.match(route, /runTradingEngineCron/);

  const runner = readSrc("src/lib/engine-cron.ts");
  assert.match(runner, /processPendingOrders\(userId\)/);
  assert.match(runner, /checkSlTp\(userId\)/);
  assert.match(runner, /status: "OPEN"/);
  assert.match(runner, /status: "PENDING"/);

  const vercel = JSON.parse(readSrc("vercel.json")) as {
    crons: Array<{ path: string; schedule: string }>;
  };
  assert.equal(vercel.crons.length, 1);
  assert.equal(vercel.crons[0].path, "/api/cron/engine");
  assert.equal(vercel.crons[0].schedule, "0 3 * * *");
  assert.equal((vercel.crons[0].schedule.match(/\*/g) || []).length, 3);

  const workflow = readSrc(".github/workflows/engine-cron.yml");
  assert.match(workflow, /cron: "\*\/5 \* \* \* \*"/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /https:\/\/7fx\.customer\.org\.tr\/api\/cron\/engine/);
  assert.match(workflow, /Authorization: Bearer \$\{CRON_SECRET\}/);
  assert.match(workflow, /secrets\.CRON_SECRET/);
  assert.match(workflow, /--max-time 35/);
  assert.match(workflow, /non-2xx/);
  assert.equal(workflow.includes("echo \"${CRON_SECRET"), false);
  assert.equal(workflow.includes("set -x"), false);

  const example = readSrc(".env.example");
  assert.match(example, /CRON_SECRET/);
  assert.match(example, /repository secret CRON_SECRET/);

  console.log("engine-cron tests passed");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
