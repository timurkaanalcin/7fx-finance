/**
 * Read-only post-deploy smoke.
 *
 *   npm run smoke -- --base-url https://7fx.customer.org.tr
 *   npm run smoke -- --base-url http://127.0.0.1:3467 --crm-url http://crm7fx.localhost:3467
 *
 * Optional signed-in checks run only when both SMOKE_USER and SMOKE_PASS are set.
 * Those checks never place an order, send a chat message, or move money.
 * Opening a CRM thread stubs the presence request so it is not marked read.
 * Credentials are read from the environment and are not stored in this file.
 *
 * SMOKE_CHANNEL=chrome uses the installed Chrome instead of bundled Chromium.
 * SMOKE_IGNORE_HTTPS=1 accepts a local self-signed certificate.
 * Plain HTTP also bypasses browser CSP. Middleware sends upgrade-insecure-requests
 * on every response, and Chrome then blocks same-origin form posts on http.
 * Response headers are still checked from Node, which does not bypass CSP.
 */
const REQUIRED_HEADERS = [
  ["x-frame-options", "DENY"],
  ["x-content-type-options", "nosniff"],
  ["referrer-policy", "strict-origin-when-cross-origin"],
];

function usage() {
  console.error("Usage: npm run smoke -- --base-url <url> [--crm-url <url>]");
  console.error("Optional env: SMOKE_USER SMOKE_PASS SMOKE_CHANNEL=chrome");
}

function parseArgs(argv) {
  let baseUrl = "";
  let crmUrl = "";
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--base-url") baseUrl = argv[i + 1] || "";
    else if (arg === "--crm-url") crmUrl = argv[i + 1] || "";
    else if (arg === "--help" || arg === "-h") return { help: true, baseUrl: "", crmUrl: "" };
  }
  return { help: false, baseUrl: baseUrl.replace(/\/$/, ""), crmUrl: crmUrl.replace(/\/$/, "") };
}

function defaultCrmUrl(baseUrl) {
  const url = new URL(baseUrl);
  const host = url.hostname;
  if (host === "localhost" || host === "127.0.0.1") {
    return `${url.protocol}//crm7fx.localhost:${url.port || (url.protocol === "https:" ? "443" : "80")}`;
  }
  return "https://crm7fx.customer.org.tr";
}

function header(res, name) {
  return res.headers.get(name) || "";
}

const results = [];

function pass(name) {
  results.push(name);
  console.log(`ok   ${name}`);
}

function fail(name, error) {
  const message = error instanceof Error ? error.message : String(error);
  results.push(`FAIL ${name}`);
  console.error(`FAIL ${name}: ${message}`);
}

async function check(name, fn) {
  try {
    await fn();
    pass(name);
  } catch (error) {
    fail(name, error);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function watchPage(page, bucket) {
  page.on("pageerror", (error) => {
    bucket.push(`pageerror: ${error.message}`);
  });
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (text.includes("favicon")) return;
    bucket.push(`console: ${text}`);
  });
}

async function main() {
  const parsed = parseArgs(process.argv.slice(2));
  if (parsed.help || !parsed.baseUrl) {
    usage();
    process.exit(parsed.help ? 0 : 2);
  }
  const baseUrl = parsed.baseUrl;
  const crmUrl = parsed.crmUrl || defaultCrmUrl(baseUrl);
  const crmHost = new URL(crmUrl).hostname;
  console.log(`smoke base ${baseUrl}`);
  console.log(`smoke crm  ${crmUrl}`);

  await check("security headers", async () => {
    const res = await fetch(baseUrl + "/");
    assert(res.ok, `landing status ${res.status}`);
    for (const pair of REQUIRED_HEADERS) {
      const got = header(res, pair[0]);
      assert(got.toLowerCase() === pair[1].toLowerCase(), `${pair[0]}=${got || "(missing)"}`);
    }
    const csp = header(res, "content-security-policy");
    assert(csp.includes("frame-ancestors 'none'"), "CSP missing frame-ancestors 'none'");
    assert(csp.includes("default-src 'self'"), "CSP missing default-src");
    const policy = header(res, "permissions-policy");
    assert(policy.includes("camera=()"), "Permissions-Policy missing camera=()");
    if (baseUrl.startsWith("https:")) {
      assert(header(res, "strict-transport-security").includes("max-age="), "HSTS missing on https");
    }
  });

  await check("cron rejects a request without the secret", async () => {
    const res = await fetch(baseUrl + "/api/cron/engine");
    assert(res.status === 401, `expected 401, got ${res.status}`);
    const body = await res.json().catch(() => ({}));
    assert(body.ok === false, "cron body should not report ok");
  });

  const { chromium } = await import("playwright");
  const launchArgs = [];
  if (crmHost === "crm7fx.localhost") {
    launchArgs.push("--host-resolver-rules=MAP crm7fx.localhost 127.0.0.1");
  }
  const channel = process.env.SMOKE_CHANNEL || "";
  const browser = await chromium.launch({
    headless: true,
    args: launchArgs,
    channel: channel || undefined,
  });
  if (baseUrl.startsWith("http:")) console.log("note browser CSP bypassed on http");

  try {
    const context = await browser.newContext({
      ignoreHTTPSErrors: process.env.SMOKE_IGNORE_HTTPS === "1",
      bypassCSP: baseUrl.startsWith("http:"),
    });
    const page = await context.newPage();
    const errors = [];
    watchPage(page, errors);

    await check("landing loads in English", async () => {
      errors.splice(0, errors.length);
      const res = await page.goto(baseUrl + "/", { waitUntil: "domcontentloaded" });
      assert(res && res.ok(), `status ${res ? res.status() : "none"}`);
      await page.waitForTimeout(500);
      const doc = await page.evaluate(() => ({
        lang: document.documentElement.lang,
        dir: document.documentElement.dir,
        text: document.body.innerText || "",
      }));
      assert(doc.lang === "en", `lang=${doc.lang}`);
      assert(doc.dir === "ltr" || doc.dir === "", `dir=${doc.dir}`);
      assert(doc.text.includes("Trade global markets from one account"), "English hero missing");
      assert(errors.length === 0, errors.join(" | "));
    });

    await check("markets page loads", async () => {
      errors.splice(0, errors.length);
      const res = await page.goto(baseUrl + "/markets", { waitUntil: "domcontentloaded" });
      assert(res && res.ok(), `status ${res ? res.status() : "none"}`);
      await page.getByRole("heading", { name: "Markets" }).waitFor({ timeout: 15000 });
      assert(errors.length === 0, errors.join(" | "));
    });

    await check("FAQ page loads", async () => {
      errors.splice(0, errors.length);
      const res = await page.goto(baseUrl + "/faq", { waitUntil: "domcontentloaded" });
      assert(res && res.ok(), `status ${res ? res.status() : "none"}`);
      await page.getByRole("heading", { name: "Questions" }).waitFor({ timeout: 15000 });
      assert(errors.length === 0, errors.join(" | "));
    });

    await check("signed-out /trade redirects to login", async () => {
      await page.goto(baseUrl + "/trade", { waitUntil: "domcontentloaded" });
      const path = new URL(page.url()).pathname;
      assert(path === "/login", `landed on ${path}`);
      await page.locator("#fx-login-identifier").waitFor({ timeout: 15000 });
    });

    await check("login fields stay readOnly while submitting", async () => {
      await page.goto(baseUrl + "/login", { waitUntil: "domcontentloaded" });
      const id = page.locator("#fx-login-identifier");
      const pw = page.locator("#fx-login-password");
      await id.waitFor();
      let release = () => {};
      const held = new Promise((resolve) => {
        release = resolve;
      });
      await page.route("**/api/auth/login", async (route) => {
        try {
          await held;
          await route.continue();
        } catch {
          /* navigation already finished or the route was released twice */
        }
      });
      const busyPromise = new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("submit did not report field state")), 8000);
        const onConsole = (msg) => {
          const text = msg.text();
          if (!text.startsWith("SMOKE_BUSY ")) return;
          clearTimeout(timer);
          page.off("console", onConsole);
          resolve(JSON.parse(text.slice("SMOKE_BUSY ".length)));
        };
        page.on("console", onConsole);
      });
      try {
        await id.fill(`smoke-absent-${Date.now()}@example.invalid`);
        await pw.fill("incorrect-password");
        const idle = await page.evaluate(() => {
          const identifier = document.getElementById("fx-login-identifier");
          const password = document.getElementById("fx-login-password");
          document.addEventListener("submit", () => {
            const liveId = document.getElementById("fx-login-identifier");
            const livePw = document.getElementById("fx-login-password");
            console.log(
              "SMOKE_BUSY " +
                JSON.stringify({
                  idReadOnly: Boolean(liveId && liveId.readOnly),
                  idDisabled: Boolean(liveId && liveId.disabled),
                  pwReadOnly: Boolean(livePw && livePw.readOnly),
                  pwDisabled: Boolean(livePw && livePw.disabled),
                })
            );
          });
          return {
            idReadOnly: identifier.readOnly,
            idDisabled: identifier.disabled,
            pwReadOnly: password.readOnly,
            pwDisabled: password.disabled,
          };
        });
        assert(idle.idReadOnly === false && idle.pwReadOnly === false, "fields should be editable before submit");
        assert(idle.idDisabled === false && idle.pwDisabled === false, "fields should not be disabled before submit");
        await page.locator('form[action="/api/auth/login"] button[type="submit"]').click({ noWaitAfter: true });
        const busy = await busyPromise;
        assert(busy.idReadOnly === true && busy.pwReadOnly === true, `readOnly id=${busy.idReadOnly} pw=${busy.pwReadOnly}`);
        assert(busy.idDisabled === false && busy.pwDisabled === false, "credential fields became disabled");
        release();
        await page.waitForURL((url) => url.pathname === "/login" && url.search.includes("error="), { timeout: 15000 });
      } finally {
        release();
        await page.unroute("**/api/auth/login").catch(() => {});
      }
    });

    await check("bad login shows an error without a crash", async () => {
      errors.splice(0, errors.length);
      await page.getByText("Those details do not match an account.").waitFor({ timeout: 15000 });
      assert(new URL(page.url()).pathname === "/login", page.url());
      assert(errors.length === 0, errors.join(" | "));
    });

    await check("CRM host login page loads", async () => {
      const crmPage = await context.newPage();
      const crmErrors = [];
      watchPage(crmPage, crmErrors);
      const root = await crmPage.goto(crmUrl + "/", { waitUntil: "domcontentloaded" });
      assert(root, "no CRM response");
      assert(new URL(crmPage.url()).hostname === crmHost, `host ${new URL(crmPage.url()).hostname}`);
      const robots = root.headers()["x-robots-tag"] || "";
      assert(robots.includes("noindex"), "CRM host root missing noindex");
      const login = await crmPage.goto(crmUrl + "/login", { waitUntil: "domcontentloaded" });
      assert(login && login.ok(), `CRM login status ${login ? login.status() : "none"}`);
      assert(new URL(crmPage.url()).hostname === crmHost, "CRM login left the CRM host");
      await crmPage.getByRole("heading", { name: "Sign In" }).waitFor({ timeout: 15000 });
      await crmPage.locator("#fx-login-identifier").waitFor();
      await crmPage.locator("#fx-login-password").waitFor();
      assert(crmErrors.length === 0, crmErrors.join(" | "));
      await crmPage.close();
    });

    await context.close();
    await signedIn(browser, baseUrl);
  } finally {
    await browser.close();
  }

  const failed = results.filter((line) => line.startsWith("FAIL")).length;
  console.log(`smoke: ${results.length - failed} passed, ${failed} failed`);
  if (failed) process.exit(1);
}

async function signedIn(browser, baseUrl) {
  const smokeUser = process.env.SMOKE_USER || "";
  const smokePass = process.env.SMOKE_PASS || "";
  if (!smokeUser || !smokePass) {
    pass("signed-in checks skipped (SMOKE_USER/SMOKE_PASS unset)");
    return;
  }
  await check("signed-in shell loads", async () => {
    const context = await browser.newContext({
      ignoreHTTPSErrors: process.env.SMOKE_IGNORE_HTTPS === "1",
      bypassCSP: baseUrl.startsWith("http:"),
    });
    const page = await context.newPage();
    const errors = [];
    watchPage(page, errors);
    await page.goto(baseUrl + "/login", { waitUntil: "domcontentloaded" });
    await page.locator("#fx-login-identifier").fill(smokeUser);
    await page.locator("#fx-login-password").fill(smokePass);
    await page.locator('form[action="/api/auth/login"] button[type="submit"]').click();
    await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 20000 });
    const path = new URL(page.url()).pathname;
    assert(path.startsWith("/trade") || path.startsWith("/izcrm"), `unexpected landing ${path}`);
    assert(errors.length === 0, errors.join(" | "));
    if (path.startsWith("/izcrm")) await arabicChatBack(context, page, baseUrl);
    else console.log("note signed-in account is not on CRM; chat back control not opened");
    await context.close();
  });
}

async function arabicChatBack(context, page, baseUrl) {
  await context.addCookies([
    { name: "fx_lang", value: "ar", url: baseUrl },
    { name: "fx_crm_lang", value: "ar", url: baseUrl },
  ]);
  await context.addInitScript(() => {
    try {
      localStorage.setItem("fx_lang", "ar");
      localStorage.setItem("fx_crm_lang", "ar");
    } catch {
      /* ignore */
    }
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(baseUrl + "/izcrm/chat", { waitUntil: "domcontentloaded" });
  const thread = page.locator("aside li button.w-full").first();
  await thread.waitFor({ timeout: 20000 });
  await page.route("**/api/admin/chat/presence", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "{}" })
  );
  await thread.click();
  const back = page.locator('button.fx-rtl-flip[aria-label="رجوع"]');
  await back.waitFor({ timeout: 10000 });
  const state = await page.evaluate(() => {
    const button = document.querySelector("button.fx-rtl-flip");
    const box = button ? button.getBoundingClientRect() : null;
    return {
      dir: document.documentElement.dir,
      lang: document.documentElement.lang,
      label: button ? button.getAttribute("aria-label") : "",
      transform: button ? getComputedStyle(button).transform : "",
      width: box ? box.width : 0,
      over: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });
  assert(state.dir === "rtl", `dir=${state.dir}`);
  assert(state.lang === "ar", `lang=${state.lang}`);
  assert(state.label === "رجوع", `label=${state.label}`);
  assert(state.transform.includes("matrix(-1"), `transform=${state.transform}`);
  assert(state.width > 0, "back control is not visible");
  assert(state.over <= 1, `horizontal overflow ${state.over}`);
  console.log(`note chat back ${state.dir} ${state.label} ${state.transform}`);
  if (process.env.SMOKE_SHOT) {
    await page.screenshot({ path: process.env.SMOKE_SHOT, fullPage: false });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exit(1);
});
