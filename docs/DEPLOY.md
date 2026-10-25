# Deploy the open stack

Production at the time of the baseline is `main` `b0d34d3` (`b0d34d39e1b719594138f3ff9dc2fe73643f76ee`, merge of #51). #47, #50, and #51 are already on `main`. Leave them merged.

This file names environment variables only. It does not contain secret values. Do not commit key material, connection strings, or smoke credentials.

## Merge order

Each pull request in the polish stack is based on the previous head. Land them on `main` from the bottom. Merge #46 into `main`. For every later row, wait until its parent is on `main`, set that pull request's base to `main`, then merge. Merging a later pull request into its feature-branch base does not update `main`.

<!-- merge-order:start -->
#46
#49
#53
#54
#55
#57
#58
#59
#60
#61
#62
#63
#64
#65
#66
#67
#68
#69
#70
#71
#72
#73
#74
#75
#76
#77
#78
#79
#80
#81
#82
#83
#84
#85
#86
#87
#88
#89
#90
#91
#92
#93
#94
#95
#96
#98
#99
#52
#56
#48
<!-- merge-order:end -->

#89 adds this file. Its base is `cursor/round62-smoke-b495` (#88). #90 (`cursor/round64-quality-infra-b495`) is stacked on #89. #91 (`cursor/round65-landing-visual-b495`) is stacked on #90. #92 (`cursor/round66-trade-candles-b495`) is stacked on #91. #93 (`cursor/round67-trade-theme-b495`) is stacked on #92. #94 (`cursor/round68-theme-grid-b495`) is stacked on #93. #95 (`cursor/round69-crm-lists-b495`) is stacked on #94. #96 (`cursor/round70-crm-keys-b495`) is stacked on #95. #98 (`cursor/round71-onboarding-b495`) is based on `main` after #97. #99 (`cursor/round72-approve-ux-b495`) is stacked on #98. Merge #89, then #90, then #91, then #92, then #93, then #94, then #95, then #96, then #98, then #99, before #52.

After #88, #89, #90, #91, #92, #93, #94, #95, #96, #98, and #99 are on `main`:

1. Retarget #52 (`cursor/auto-login-impersonation-f020`) from `cursor/round33-register-platform-b495` to `main`, then merge #52.
2. Set the #56 variables on the Vercel project (below), then merge #56 (`cursor/live-support-autoreply-push-61c4`, base `main`).
3. Merge #48 (`cursor/optional-source-account-f34f`, base `main`).

Heads, for the same order:

| PR | Head |
| --- | --- |
| #46 | `cursor/type-refine-b495` |
| #49 | `cursor/round27-sizing-lcp-b495` |
| #53 | `cursor/round28-metrics-strip-b495` |
| #54 | `cursor/round29-crm-lcp-b495` |
| #55 | `cursor/round30-landing-ticket-b495` |
| #57 | `cursor/round31-seo-a11y-b495` |
| #58 | `cursor/round32-landing-video-markets-b495` |
| #59 | `cursor/round33-register-platform-b495` |
| #60 | `cursor/round34-crm-cashier-b495` |
| #61 | `cursor/round35-terminal-lists-b495` |
| #62 | `cursor/round36-trade-perf-b495` |
| #63 | `cursor/round37-states-404-b495` |
| #64 | `cursor/round38-i18n-audit-b495` |
| #65 | `cursor/round39-crm-i18n-b495` |
| #66 | `cursor/round40-pwa-mobile-b495` |
| #67 | `cursor/round41-test-guards-b495` |
| #68 | `cursor/round42-crm-hook-deps-b495` |
| #69 | `cursor/round43-security-headers-b495` |
| #70 | `cursor/round44-api-error-host-b495` |
| #71 | `cursor/round45-redirect-allowlist-b495` |
| #72 | `cursor/round46-public-cache-b495` |
| #73 | `cursor/round47-private-marketing-b495` |
| #74 | `cursor/round48-crm-inbox-b495` |
| #75 | `cursor/round49-crm-traders-b495` |
| #76 | `cursor/round50-crm-queues-b495` |
| #77 | `cursor/round51-account-statement-b495` |
| #78 | `cursor/round52-landing-cta-b495` |
| #79 | `cursor/round53-register-ux-b495` |
| #80 | `cursor/round54-motion-keyboard-b495` |
| #81 | `cursor/round55-dep-hygiene-b495` |
| #82 | `cursor/round56-empty-states-b495` |
| #83 | `cursor/round57-mobile-qa-b495` |
| #84 | `cursor/round58-signed-in-qa-b495` |
| #85 | `cursor/round59-client-perf-b495` |
| #86 | `cursor/round60-trader-i18n-b495` |
| #87 | `cursor/round61-rtl-i18n-b495` |
| #88 | `cursor/round62-smoke-b495` |
| #89 | `cursor/round63-deploy-docs-b495` |
| #90 | `cursor/round64-quality-infra-b495` |
| #91 | `cursor/round65-landing-visual-b495` |
| #92 | `cursor/round66-trade-candles-b495` |
| #93 | `cursor/round67-trade-theme-b495` |
| #94 | `cursor/round68-theme-grid-b495` |
| #95 | `cursor/round69-crm-lists-b495` |
| #96 | `cursor/round70-crm-keys-b495` |
| #98 | `cursor/round71-onboarding-b495` |
| #99 | `cursor/round72-approve-ux-b495` |
| #52 | `cursor/auto-login-impersonation-f020` |
| #56 | `cursor/live-support-autoreply-push-61c4` |
| #48 | `cursor/optional-source-account-f34f` |

## Environment variables

Names only. Keep the values that are already on the Vercel project. This merge does not rotate them.

Already read by the app on `main` (no pull request in the list above introduces these):

- `DATABASE_URL`
- `AUTH_SECRET`
- `JWT_SECRET`
- `CRON_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_ROTATE_PASSWORD`
- `ALLOW_DEMO_SEED`
- `SEED_SECRET`
- `COOKIE_DOMAIN`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SITE_ORIGIN`
- `APP_URL`
- `MAIN_SITE_ORIGIN`
- `OPENAI_API_KEY`
- `SUPPORT_AI_MODEL`
- `AI_ASSISTANT_MODEL`
- `FORCE_REFERRAL_REQUIRED`
- `FORCE_IMPERSONATION_OFF`

`CRON_SECRET` must be set. The engine route returns 401 for a bearer mismatch and 503 when the variable is unset. Vercel Cron sends `Authorization: Bearer` with this value on `GET /api/cron/engine`.

Per pull request, new Vercel variables:

| PRs | New Vercel variables |
| --- | --- |
| #46 through #99 | none |
| #52 | none |
| #56 | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` |
| #48 | none |

Set the three #56 names on Vercel before merging #56. Generate the key pair with:

```
npx web-push generate-vapid-keys
```

Put the public key in `VAPID_PUBLIC_KEY` and the private key in `VAPID_PRIVATE_KEY`. Set `VAPID_SUBJECT` to the mailto contact for the push sender. Store the output in Vercel only. In-app alerts still save when the keys are absent; browser push waits for these three names.

#48 does not add a Vercel variable. `tests/source-account-optional.test.ts` reads `SOURCE_ACCOUNT_API` in a local shell and skips that check when the name is unset.

The smoke script reads these names on the machine that runs it. They are not Vercel project variables:

- `SMOKE_USER` and `SMOKE_PASS` — signed-in checks run only when both are set. Leave both unset for the signed-out run.
- `SMOKE_CHANNEL` — set to `chrome` to use an installed Chrome. Unset uses Playwright's Chromium (`npx playwright install chromium`).
- `SMOKE_IGNORE_HTTPS` — set to `1` only for a local self-signed certificate.
- `SMOKE_SHOT` — file path for an optional screenshot of the Arabic chat back control.

## Post-deploy smoke

From a checkout that contains `scripts/smoke.mjs` (this stack, #88 or later):

```
npx playwright install chromium
npm run smoke -- --base-url https://7fx.customer.org.tr --crm-url https://crm7fx.customer.org.tr
```

Leave `SMOKE_USER` and `SMOKE_PASS` unset. Each run calls `GET /api/cron/engine` once, without a bearer token, and expects HTTP 401. Do not call that path again yourself.

Signed-out, the script records `ok   signed-in checks skipped (SMOKE_USER/SMOKE_PASS unset)` and prints `smoke: N passed, M failed`. When the CRM certificate does not match its hostname, the script adds one `infra` line and still exits 0 if every application check passed.

## CRM host certificate

`crm7fx.customer.org.tr` DNS currently points at a cPanel server, `94.73.150.188`. The certificate common name is `cpls12.srvpanel.com`. That host is not the Vercel app. The mismatch is infrastructure outside this repository. The smoke script reads the certificate, prints `infra CRM host cert/DNS mismatch` with the resolved IP when DNS answers, and does not count it as a failed check. `SMOKE_IGNORE_HTTPS=1` skips that probe for a local self-signed certificate. `vercel alias set` on `7fx.customer.org.tr` does not change this DNS record or certificate.

## Upload

Hobby blocks a git deployment when the commit author is not on the team. Deploy from a copy of the tree that has no `.git` directory. `npm run build` is the Vercel build command: it runs `prisma generate`, `next build`, and `scripts/publish-deferred-css.mjs`, which writes `/fx-public-utilities.css` and `/fx-landing.css`.

```
rm -rf /tmp/7fx-deploy
mkdir -p /tmp/7fx-deploy
rsync -a --exclude .git --exclude node_modules --exclude .next --exclude '.env*' ./ /tmp/7fx-deploy/
cd /tmp/7fx-deploy
npx vercel deploy --prod
```

## Rollback

Before the first merge, record the deployment that currently serves production (`vercel inspect 7fx.customer.org.tr`, or the production row in the Vercel dashboard). To send traffic back to that deployment:

```
vercel alias set <previous-deployment-url-or-id> 7fx.customer.org.tr
```

The rollback target for the production alias now on `7fx.customer.org.tr` (`dpl_CmBUznKxub1TxFvnyTKZQy8x7wCM`) is the previous production deployment `dpl_Z5Wgvb247KcqbX9QncEYpamENfr1`:

```
vercel alias set 7fx-finance-3ajnsb205-llvad-1323.vercel.app 7fx.customer.org.tr
```

`<previous-deployment-url-or-id>` is the deployment id or hostname saved before the new deployment was aliased. The command updates the `7fx.customer.org.tr` alias. `crm7fx.customer.org.tr` is a separate host (`docs/CRM7FX-DNS-REQUIRED.txt`). This alias command does not change that host's DNS or certificate.

## Production baseline (signed-out, current production)

Ran once against `https://7fx.customer.org.tr` and `https://crm7fx.customer.org.tr` with `SMOKE_USER` and `SMOKE_PASS` unset and `SMOKE_CHANNEL=chrome`. Exit code 1. The cron route was requested once (`ok cron rejects a request without the secret`). Do not repeat this baseline.

```
smoke base https://7fx.customer.org.tr
smoke crm  https://crm7fx.customer.org.tr
ok   security headers
ok   cron rejects a request without the secret
ok   landing loads in English
ok   markets page loads
ok   FAQ page loads
ok   signed-out /trade redirects to login
ok   login fields stay readOnly while submitting
FAIL bad login shows an error without a crash: locator.waitFor: Timeout 15000ms exceeded.
Call log:
  - waiting for getByText('Those details do not match an account.') to be visible

FAIL CRM host login page loads: page.goto: net::ERR_CERT_COMMON_NAME_INVALID at https://crm7fx.customer.org.tr/
Call log:
  - navigating to "https://crm7fx.customer.org.tr/", waiting until "domcontentloaded"

TypeError: pass is not a function
    at signedIn (file:///tmp/round62/scripts/smoke.mjs:298:5)
    at main (file:///tmp/round62/scripts/smoke.mjs:284:11)
```

What that output means:

- Security headers, cron 401, English landing, markets, FAQ, signed-out `/trade` → `/login`, and read-only login fields during submit all passed on current production.
- The bad-login sentence is copy from this stack. Production is still `b0d34d3`, so that timeout is the expected gap until this stack is deployed.
- `net::ERR_CERT_COMMON_NAME_INVALID` on `https://crm7fx.customer.org.tr/` is the cPanel certificate (`94.73.150.188`, CN `cpls12.srvpanel.com`). The script that produced this baseline treated it as a failed check. The current script reports the same condition as `infra CRM host cert/DNS mismatch` and does not fail the run for it.
- `TypeError: pass is not a function` is the #88 smoke script: `const pass = process.env.SMOKE_PASS` shadowed the `pass()` reporter, so a signed-out run threw before the summary line. #89 renames those locals to `smokeUser` and `smokePass`. The skip path is covered by the unit test. The production baseline was not run again.
