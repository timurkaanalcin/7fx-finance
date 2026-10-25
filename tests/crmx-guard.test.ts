/**
 * /crmx uses the same session gate as /izcrm.
 * Signed-out visitors redirect to the admin login.
 * Non-admins are blocked (sent to the terminal).
 * Run: npx tsx tests/crmx-guard.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { NextRequest } from "next/server";
import { middleware } from "../src/middleware";
import { decideCrmxSession, scopedCrmxPageAllowed } from "../src/lib/crmx/guard";

const ROOT = path.resolve(__dirname, "..");

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function request(urlPath: string, host: string, cookie?: string) {
  return new NextRequest(`http://127.0.0.1:3000${urlPath}`, {
    headers: {
      "x-forwarded-host": host,
      "x-forwarded-proto": "https",
      host: "127.0.0.1:3000",
      ...(cookie ? { cookie } : {}),
    },
  });
}

function main() {
  const signedOut = middleware(request("/crmx", "7fx.customer.org.tr"));
  assert.equal(signedOut.headers.get("location"), "https://7fx.customer.org.tr/login");

  const signedOutNested = middleware(request("/crmx/traders/abc", "7fx.financeunit.co"));
  assert.equal(signedOutNested.headers.get("location"), "https://7fx.financeunit.co/login");

  const control = middleware(request("/crmx/deposits", "7fx.control.org.tr"));
  assert.equal(control.headers.get("location"), "https://7fx.control.org.tr/login");

  const crmHost = middleware(request("/crmx", "crm7fx.customer.org.tr"));
  assert.equal(crmHost.headers.get("location"), "https://crm7fx.customer.org.tr/login");

  const crmLocal = middleware(request("/crmx/chat", "crm7fx.localhost"));
  assert.equal(crmLocal.headers.get("location"), "https://crm7fx.localhost/login");

  const signedIn = middleware(request("/crmx/traders", "7fx.customer.org.tr", "7fx_session=present"));
  assert.equal(signedIn.headers.get("location"), null);
  assert.equal(signedIn.status, 200);

  const crmSignedIn = middleware(request("/crmx/tickets", "crm7fx.customer.org.tr", "deskflow_session=present"));
  assert.equal(crmSignedIn.headers.get("location"), null);
  assert.equal(crmSignedIn.status, 200);

  const izcrmStill = middleware(request("/izcrm", "crm7fx.customer.org.tr"));
  assert.equal(izcrmStill.headers.get("location"), "https://crm7fx.customer.org.tr/login");

  const blank = middleware(request("/trade", "crm7fx.customer.org.tr", "7fx_session=present"));
  assert.equal(blank.status, 200);
  assert.equal(blank.headers.get("location"), null);
  assert.match(blank.headers.get("content-type") || "", /text\/html/);

  assert.deepEqual(decideCrmxSession({ authenticated: false, role: null }), {
    allow: false,
    redirect: "/login",
  });
  assert.deepEqual(decideCrmxSession({ authenticated: true, role: "TRADER" }), {
    allow: false,
    redirect: "/trade",
  });
  assert.deepEqual(decideCrmxSession({ authenticated: true, role: "USER" }), {
    allow: false,
    redirect: "/trade",
  });
  assert.deepEqual(decideCrmxSession({ authenticated: true, role: null }), {
    allow: false,
    redirect: "/trade",
  });
  assert.deepEqual(decideCrmxSession({ authenticated: true, role: "ADMIN" }), { allow: true });

  assert.equal(scopedCrmxPageAllowed("/crmx/traders"), true);
  assert.equal(scopedCrmxPageAllowed("/crmx/import"), false);
  assert.equal(scopedCrmxPageAllowed("/crmx/licenses/extra"), false);
  assert.equal(scopedCrmxPageAllowed("/izcrm/traders"), false);

  const shell = read("src/components/crmx/Shell.tsx");
  assert.match(shell, /decideCrmxSession/);
  assert.match(shell, /router\.push\(decision\.redirect\)/);
  assert.match(shell, /\/api\/auth\/me\?scope=admin/);

  const approve = read("src/components/crmx/ui.tsx");
  assert.match(approve, /required=\{false\}/);
  assert.match(approve, /readOnly=\{busy\}/);
  assert.doesNotMatch(approve, /approvalReason[\s\S]{0,80}required:\s*true/);
  assert.equal(approve.includes("sourceUserId"), false);

  const gate = read("src/middleware.ts");
  assert.match(gate, /pathname === "\/crmx"/);
  assert.match(gate, /isCrmDeskPath\(pathname\)/);

  console.log("crmx guard tests passed");
}

main();
