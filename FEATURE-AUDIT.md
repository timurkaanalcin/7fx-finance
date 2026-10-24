# 7FX Feature Audit — live vs code

**When:** 2026-10-24 ~17:15 Europe/Kiev  
**Live:** https://7fx.control.org.tr (also https://7fx-finance.vercel.app)  
**Source:** `/workspace/7fx-finance` branch `work/restore-missing-features`  
**Vercel:** `prj_A99RD3HWba8Sdf8IYnhTYYQq2rmo` / team `llvad-1323`  
**Production deploy:** `dpl_6qu1NWhVAKvmakkH2SQtDtsybsRK (eyebrow fix; prior dpl_3qWyuv24…)` (READY; CLI file deploy, no git meta)

Legend: **OK** present · **MISS** missing · **HIDDEN** code OK, empty data · **CANDIDATE** HRAM-era

## Landing (verified live after restore)

| Feature | Live now | Notes |
|---|---|---|
| MULTI-ASSET eyebrow + ING pill | OK | OK — **MULTI-ASSET INVESTMENT PLATFORM** live |
| 1cm gap eyebrow↔ING | OK | `gap-[1cm]` in HTML |
| EN language selector 7.8px | OK | `text-[7.8px]` on compact switcher |
| Güvenlik ve Lisans section | OK | `#guvenlik` — practices only, no fake licence claims |
| Altyapı ve Sağlayıcılar | OK | **Vercel** hosting (Railway removed) + Yahoo, TradingView LW, MySQL, Prisma, Next.js |
| Sponsors public | HIDDEN | `/api/sponsors` → `{"sponsors":[]}` — section unmounted when empty |
| Licenses public + Resmi kayıtta doğrula | HIDDEN | `/api/licenses` → `{"licenses":[]}` — no fake data |

## CRM `/izcrm` (signed-out)

| Feature | Live | Notes |
|---|---|---|
| `/izcrm` | 307 → `/login` | Expected |
| `/izcrm/sponsors`, `/licenses`, `/documents`, `/evrak` | 307 → login | Pages in build output |
| `/api/support` | **401** | Correct when signed out |
| Notifications / Web Push / AI support | Behind auth | Code OK; Vercel has OPENAI, VAPID_*, AUTH_SECRET, SUPPORT_AI_MODEL=gpt-4.1-mini |
| Import / workers / permissions / positions / rates | Behind auth | Already in 7FX CRM (not HRAM-only) |

## Trading / PWA

| Feature | Live | Notes |
|---|---|---|
| `sw.js` | 200 | OK |
| `site.webmanifest` | 200 | `/manifest.json` 404 is fine |
| InstallBanner | Client | Present in `src/components/InstallBanner.tsx`; hidden on `/izcrm` |
| Trade UI (collapsible panel, Al/Sat) | Behind `/trade` auth | 307 when signed out |

## HRAM-sibling candidates (NOT auto-added)

- Shift accounts, exotic bulk balance ops beyond existing 7FX tools — **CANDIDATE** only

## Env on Vercel (names only — secrets not printed)

Present: DATABASE_URL, AUTH_SECRET, OPENAI_API_KEY, SUPPORT_AI_MODEL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT, NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_SITE_ORIGIN, MAIN_SITE_ORIGIN, CRON_SECRET, ADMIN_*, ALLOW_DEMO_SEED  
Note: `NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_SITE_ORIGIN` still point at financeunit.co; `MAIN_SITE_ORIGIN` is control.org.tr.

## Deploy notes / blockers resolved

- Git-connected CLI deploys from `timurkaanalcin/*` were **BLOCKED** (team collaboration / foreign git author).
- Fix: deploy from a **no-`.git`** tree via `vercel deploy --prod --force` → READY and aliased to control.org.tr + other domains.
- Vercel GitHub App still cannot see private `timurkaanalcin/7fx-finance` for auto git deploys.

## Screenshots

- `/workspace/7fx-audit-landing.png`
- `/workspace/7fx-audit-landing-full.png`
- `/workspace/7fx-audit-security.png`
- `/workspace/7fx-audit-infra.png`
- `/workspace/7fx-audit-login.png`
- `/workspace/7fx-audit-izcrm-redirect.png`
- `/workspace/7fx-audit-trade-auth.png`
