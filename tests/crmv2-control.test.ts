/**
 * Control panel helpers stay free of secrets and do not apply a migration.
 * Run: npx tsx tests/crmv2-control.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { API_KEY_DESIGN, API_KEY_MIGRATION_SQL, BACKUP_STATE, auditLevel, scrubMeta, scrubValue } from "../src/lib/crmv2/control";

const route = fs.readFileSync(path.join(__dirname, "../src/app/api/admin/control/route.ts"), "utf8");

function main() {
  const scrubbed = scrubValue({ password: "secret-value", note: "desk moved", nested: { token: "abc", ok: 1 } }) as {
    password: string;
    note: string;
    nested: { token: string; ok: number };
  };
  assert.equal(scrubbed.password, "[redacted]");
  assert.equal(scrubbed.nested.token, "[redacted]");
  assert.equal(scrubbed.note, "desk moved");
  assert.equal(scrubbed.nested.ok, 1);
  assert.equal(scrubValue("mysql://user:pass@db/app"), "[redacted]");
  assert.equal(scrubValue("Bearer abc.def.ghi"), "[redacted]");
  assert.equal(scrubMeta('{"apiKey":"live","action":"EXPORT"}') && (scrubMeta('{"apiKey":"live","action":"EXPORT"}') as { apiKey: string }).apiKey, "[redacted]");

  assert.equal(auditLevel("WORKER_DELETE"), "error");
  assert.equal(auditLevel("DEPOSIT_REJECT"), "warn");
  assert.equal(auditLevel("ADD_NOTE"), "info");

  assert.equal(BACKUP_STATE.configured, false);
  assert.equal(BACKUP_STATE.canDump, false);
  assert.equal(BACKUP_STATE.canRestore, false);
  assert.equal(API_KEY_DESIGN.schemaSupported, false);
  assert.equal(API_KEY_DESIGN.plaintextStored, false);
  assert.match(API_KEY_MIGRATION_SQL, /CREATE TABLE ApiKey/);
  assert.match(API_KEY_MIGRATION_SQL, /hash VARCHAR/);

  assert.match(route, /requireAdmin/);
  assert.equal(route.includes("$executeRaw"), false);
  assert.equal(route.includes("prisma.apiKey"), false);
  assert.equal(route.includes("DATABASE_URL"), false);
  assert.equal(route.includes("process.env.CRON_SECRET?.trim()"), true);
  assert.equal(route.includes("CRON_SECRET }"), false);

  console.log("crmv2-control tests passed");
}

main();
