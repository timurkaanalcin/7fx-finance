/**
 * Source account is optional on CRM internal transfers.
 * Run: npx tsx tests/source-account-optional.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readSrc(rel: string): string {
  return fs.readFileSync(path.join(__dirname, "..", rel), "utf8");
}

function sliceBetween(haystack: string, start: string, end: string): string {
  const i = haystack.indexOf(start);
  assert.notEqual(i, -1, `missing ${start}`);
  const j = haystack.indexOf(end, i + start.length);
  assert.notEqual(j, -1, `missing ${end} after ${start}`);
  return haystack.slice(i, j);
}

function main() {
  const page = readSrc("src/app/(admin)/izcrm/traders/[id]/page.tsx");
  const sourceField = sliceBetween(page, 'key: "sourceUserId"', 'key: "amount"');
  assert.match(sourceField, /label: "crm\.edit\.sourceAccount"/);
  assert.doesNotMatch(sourceField, /required:\s*true/);
  assert.match(sourceField, /showIf: \(d\) => d\.type === "TRANSFER"/);
  assert.match(page, /function SourceAccountPicker/);
  assert.doesNotMatch(sliceBetween(page, "function SourceAccountPicker", "function Field"), /required/);

  const route = readSrc("src/app/api/admin/users/[id]/records/route.ts");
  assert.doesNotMatch(route, /reqStr\(\s*body\.sourceUserId/);
  assert.doesNotMatch(route, /sourceUserId required/);
  assert.match(route, /const sourceUserId = str\(body\.sourceUserId, 64\)/);
  assert.match(route, /=== "TRANSFER" && sourceUserId/);
  assert.match(route, /internalTransfer\(body, userId, sourceUserId, admin, apply\)/);

  const dict = readSrc("src/lib/i18n/dictionaries/crm-ui.ts");
  assert.match(dict, /\["crm\.edit\.sourceAccount", "Source account", "Kaynak hesap"/);
  assert.doesNotMatch(dict, /Source account: required|Kaynak hesap: zorunlu/);

  const schemas = [
    "prisma/schema.prisma",
    "src/lib/crm-balance.ts",
    "src/lib/ledger.ts",
    "src/lib/trading.ts",
  ];
  for (const rel of schemas) {
    const before = readSrc(rel);
    assert.equal(before.includes("sourceUserId"), false, `${rel} should not gain a source column`);
  }

  console.log("source-account-optional static tests passed");
}

async function apiCheck() {
  const base = process.env.SOURCE_ACCOUNT_API;
  if (!base) {
    console.log("SOURCE_ACCOUNT_API unset — skipped local API check");
    return;
  }
  const host = new URL(base).hostname;
  assert.ok(host === "127.0.0.1" || host === "localhost", "API check is local only");

  const login = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "admin@7fx.local", password: "Admin123!" }),
  });
  assert.equal(login.status, 200, await login.text());
  const cookie = (login.headers.getSetCookie?.() ?? [])
    .map((c) => c.split(";")[0])
    .filter((c) => c.startsWith("7fx_session="))
    .join("; ");
  assert.ok(cookie.includes("7fx_session="), "admin session cookie");

  const traders = await fetch(`${base}/api/admin/users?take=20&meta=0&view=picker`, {
    headers: { cookie },
  });
  assert.equal(traders.status, 200);
  const listed = (await traders.json()) as {
    users?: { id: string; email?: string; role?: string }[];
  };
  const targets = (listed.users || []).filter((u) => (u.role ?? "TRADER") !== "ADMIN");
  assert.ok(targets.length >= 2, "need two traders");
  const target = targets[0];
  const source = targets[1];

  const beforeTarget = await accountBalance(base, cookie, target.id);
  const beforeSource = await accountBalance(base, cookie, source.id);

  const missing = await fetch(`${base}/api/admin/users/${target.id}/records`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({
      entity: "ledger",
      type: "TRANSFER",
      amount: 15,
      sourceUserId: "",
      applyToBalance: false,
    }),
  });
  const missingBody = await missing.json();
  assert.equal(missing.status, 200, JSON.stringify(missingBody));
  assert.equal(missingBody.ok, true);
  assert.equal(missingBody.row.type, "TRANSFER");
  assert.equal(missingBody.row.userId, target.id);
  assert.equal(missingBody.row.comment ?? null, null);
  assert.equal(missingBody.balance, null);

  const afterMissingTarget = await accountBalance(base, cookie, target.id);
  const afterMissingSource = await accountBalance(base, cookie, source.id);
  assert.equal(afterMissingTarget, beforeTarget);
  assert.equal(afterMissingSource, beforeSource);

  const legs = await fetch(`${base}/api/admin/users/${target.id}?view=ledger`, {
    headers: { cookie },
  });
  assert.equal(legs.status, 200);
  const ledger = (await legs.json()) as { ledger?: { id: string; refType?: string | null; refId?: string | null }[] };
  const row = (ledger.ledger || []).find((r) => r.id === missingBody.row.id);
  assert.ok(row, "created ledger row is listed");
  assert.equal(row.refType, "CRM");
  const sourceLedger = await fetch(`${base}/api/admin/users/${source.id}?view=ledger`, { headers: { cookie } });
  assert.equal(sourceLedger.status, 200);
  const sourceRows = ((await sourceLedger.json()) as { ledger?: { id: string; refId?: string | null }[] }).ledger || [];
  const paired = sourceRows.filter((r) => row.refId && r.refId === row.refId);
  assert.equal(paired.length, 0, "omitted source does not write a counterpart leg");

  const withSource = await fetch(`${base}/api/admin/users/${target.id}/records`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({
      entity: "ledger",
      type: "TRANSFER",
      amount: 5,
      sourceUserId: source.id,
      applyToBalance: false,
    }),
  });
  const withBody = await withSource.json();
  assert.equal(withSource.status, 200, JSON.stringify(withBody));
  assert.equal(withBody.row.refType, "TRANSFER");
  assert.equal(await accountBalance(base, cookie, target.id), beforeTarget);
  assert.equal(await accountBalance(base, cookie, source.id), beforeSource);

  const applied = await fetch(`${base}/api/admin/users/${target.id}/records`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({
      entity: "ledger",
      type: "TRANSFER",
      amount: 7,
      sourceUserId: null,
      applyToBalance: true,
    }),
  });
  const appliedBody = await applied.json();
  assert.equal(applied.status, 200, JSON.stringify(appliedBody));
  assert.equal(await accountBalance(base, cookie, target.id), beforeTarget + 7);
  assert.equal(await accountBalance(base, cookie, source.id), beforeSource);

  console.log("source-account-optional local API check passed");
}

async function accountBalance(base: string, cookie: string, userId: string): Promise<number> {
  const res = await fetch(`${base}/api/admin/users/${userId}`, { headers: { cookie } });
  assert.equal(res.status, 200, await res.clone().text());
  const data = (await res.json()) as { user?: { balance?: number }; account?: { balance?: number } };
  const n = data.account?.balance ?? data.user?.balance;
  assert.equal(typeof n, "number");
  return n as number;
}

main();
void apiCheck();
