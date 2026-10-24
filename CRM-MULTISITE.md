# CRM host + multi-site customers

## CRM host
- `https://crm.control.org.tr` is attached to Vercel project `7fx-finance`.
- DNS (Natro → control.org.tr → Profesyonel DNS): `CNAME  crm  20378016531dd05f.vercel-dns-017.com.`
  (alternative: `A crm 76.76.21.21`). TLS is issued by Vercel once DNS resolves.
- Middleware: on the CRM host `/` → `/izcrm` (signed in) or `/login`; `/izcrm/*` auth-gated; everything
  else except `/api/*` and static assets returns a blank noindex page. Non-admins who sign in on the
  CRM host are sent to `https://7fx.control.org.tr/trade`.
- Once DNS is live, set Vercel env `CRM_HOST_ONLY=1` and redeploy: `7fx.control.org.tr/izcrm/*` then
  308-redirects to the CRM host (same path). Until then `/izcrm` keeps working on the trading host.
- Session cookies are host-only: admins sign in once on the CRM host.

## Multi-site customers
- `User.site` (VarChar 32, default `"7fx"`, indexed) + `User.siteExternalId` (nullable). Additive only;
  existing rows read as `7fx`.
- Registration on this deployment stores `SITE_KEY` env or `7fx`.
- CRM → Traderlar: site tabs (Tümü / 7FX / MFX / any other key with counts), Site column badge,
  site in CSV export, site on "Yeni üye" form, site on trader detail (editable), site default on bulk import.
- Admins see all sites; scoped Sales/Retention staff still only see assigned customers.

## Ingest API for other sites
`POST https://7fx.control.org.tr/api/ingest/customers` (also works on the CRM host)

```
Authorization: Bearer <site token>
Content-Type: application/json
{ "customers": [ { "externalId": "123", "email": "a@b.com", "firstName": "A", "lastName": "B",
                   "phone": "+90…", "country": "TR", "language": "tr", "campaign": "…",
                   "registeredAt": "2026-10-01T10:00:00Z" } ] }
```
- Token → site key comes from `SITE_INGEST_TOKENS` env (`mfx:<token>,other:<token>`), never from the body.
- Idempotent: match by (site, externalId) then email. Same-site rows: contact fields refreshed only.
  Emails owned by another site → `conflict`, untouched. New rows: TRADER, random unusable password,
  empty USD account, saleStatus NEW. Max 200 per request. `GET` with the token = connection test.
- Server-to-server only (requests with a foreign browser `Origin` are rejected by middleware).
