# 7FX Feature Audit — live vs code

**When:** 2026-10-24 (Europe/Kiev)  
**Live:** https://7fx.control.org.tr (also https://7fx-finance.vercel.app)  
**Source:** `/workspace/7fx-finance` branch `deploy/landing-on-main` (+ restore commits)  
**Vercel:** `prj_A99RD3HWba8Sdf8IYnhTYYQq2rmo` / team `llvad-1323`

Legend: **OK** present · **MISS** missing on live or dropped from shipped UI · **HIDDEN** code OK, empty data · **CANDIDATE** HRAM-era, add only if clearly wanted

## Landing

| Feature | Live (before restore) | Code | Action |
|---|---|---|---|
| MULTI-ASSET eyebrow + ING pill | OK | OK | Keep |
| 1cm gap eyebrow↔ING | OK on live (`landing-light`) | Was MISS on `landing-v2` redesign | **Restored** `gap-[1cm]` |
| EN language selector 7.8px | OK on live | Was 11px on redesign | **Restored** `text-[7.8px]` compact |
| Güvenlik ve Lisans section | OK (EN copy on live) | Dropped from landing-v2 | **Restored** |
| Altyapı ve Sağlayıcılar | OK but **Railway** hosting | Dropped / Railway | **Restored** with **Vercel** hosting |
| Sponsors public section | HIDDEN (API `[]`) | Component existed, not mounted | **Re-mounted**; stays hidden when empty |
| Licenses public + “Resmi kayıtta doğrula” | HIDDEN (API `[]`) | Same | **Re-mounted**; no fake licenses |

## CRM `/izcrm` (signed-out → Sign In 200)

| Feature | Live/API | Code | Notes |
|---|---|---|---|
| `/izcrm` shell + nav | Redirect Sign In | OK | Expected 401/Sign In when signed out |
| `/izcrm/sponsors` admin | Behind auth | OK page + `/api/admin/sponsors` | Upload, order, AI sıralasın in page |
| `/izcrm/licenses` admin | Behind auth | OK | Regulator/number/entity/https/logo |
| Evraklar `/izcrm/evrak` + `/documents` | Behind auth | OK | Protected viewer APIs present |
| Chat attachments | Behind auth | OK `/api/admin/chat/attachments`, `/api/support/attachments` | |
| Notification bell + Web Push | Behind auth | OK `NotificationBell`, `sw.js`, VAPID schema | Verify env on Vercel |
| Live support AI | `/api/support` → **401** signed out | OK `support-ai.ts`, FAQ, handoff keywords | Not `/api/support/chat` (404) — real path is `/api/support` |
| Import CSV / workers / permissions | Behind auth | OK (`/izcrm/import`, workers, user permissions) | Already in 7FX CRM |
| Positions / rates admin | Behind auth | OK `/izcrm/positions`, `/izcrm/rates` | Edit rates/P&L paths exist in admin APIs |

## Trading / PWA

| Feature | Live | Code | Action |
|---|---|---|---|
| PWA InstallBanner (Yükle, iOS sheet, hide /izcrm) | OK strings | OK | Keep |
| `sw.js` | 200 | OK | Keep |
| `site.webmanifest` | linked | OK (`/site.webmanifest`) | `/manifest.json` 404 is fine |
| Collapsible market panel / Al-Sat chart UI | Behind `/trade` auth | Present in trading components | Verify after login |
| Crypto + FX + commodities on landing | OK | OK | Keep |

## HRAM-sibling candidates (NOT auto-added)

- Shift accounts, exotic bulk balance ops beyond existing balance-requests — **CANDIDATE**
- Anything not already mirrored by 7FX `import` / `workers` / `permissions` / `positions` — leave unless product asks

## Env (Vercel — do not print secrets)

Expected: `DATABASE_URL` (TiDB), `AUTH_SECRET`, `OPENAI_API_KEY`, `SUPPORT_AI_MODEL`, `VAPID_*`, `NEXT_PUBLIC_APP_URL`  
Copy from Railway as llvad if any missing.

## Deploy blockers

- Vercel GitHub App cannot see `timurkaanalcin/7fx-finance` → file/CLI deploy required
- No fake licenses/Barclays; no DB wipe; additive schema only
