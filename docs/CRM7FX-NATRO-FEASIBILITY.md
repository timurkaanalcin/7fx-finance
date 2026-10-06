# crm7fx.customer.org.tr — Natro feasibility (investigate only; no deploy)

**Date:** 2026-10-06 (Europe/Kiev)  
**Railway proxy:** STOPPED. No proxy service/domain was created (Railway free-plan custom-domain limit blocked create earlier). Nothing to delete.

## What exists on Natro

| Item | Finding |
|------|---------|
| Hosting | Natro **cPanel shared** (LiteSpeed). Same IP as HRAM/apex: **94.73.150.188** (`cpls12.srvpanel.com`). FTPS/netrc: `machine 94.73.150.188` / `cpls12.srvpanel.com`, user `u2729680` (`/workspace/7fx-upload/netrc`). Deploy scripts use FTPS + extract-once for HRAM. |
| Panel features | Docs (`DEPLOY-CPANEL.md`, `natro-deploy/setup_cpanel.py`) confirm **Setup Node.js App / Application Manager** (Passenger), MySQL® Databases, Subdomains, SSL. Not PHP-only. |
| Node.js | **Supported** — Next.js via `server.js` + cPanel Node app (same pattern as M1/7fx cPanel packs). |
| Current 7fx edge | `7fx.customer.org.tr` still has Natro A + PHP reverse-proxy pack (`7fx-natro-proxy/`) → Railway app. Live DNS also shows Railway CNAME/`69.46.46.81` depending on resolver. |

## DNS: crm7fx.customer.org.tr

- Public resolvers (**1.1.1.1 / 8.8.8.8**): **A → 94.73.150.188** (Natro).
- Zone NS: `ns1.natrohost.com` / `ns2.natrohost.com`.
- Direct dig **@ns1.natrohost.com**: **timed out** from this box (Natro auth NS often firewalled); public recursion is authoritative enough for planning.

Subdomain already points at Natro shared IP — docroot/subdomain may need creating in cPanel if empty.

## Outbound MySQL to Railway `7fxfin`

| Check | Result |
|-------|--------|
| App `DATABASE_URL` | `mysql://…@mysql.railway.internal:3306/7fxfin` (**private network only**) |
| Public hostname | `mysql-production-e475.up.railway.app` resolves (69.46.46.90) |
| TCP **3306** from outside | **CLOSED / timeout** — no public MySQL listener |
| Natro → Railway DB | **Not reachable** today |

Enabling Railway **TCP Proxy / public networking** on MySQL would be required for option (a) with the live DB (security tradeoff). Local Natro MySQL would be a **separate** DB, not live CRM data.

## Options

**(a) Node app on Natro (Next.js CRM) against same Railway DB**  
- Hosting: feasible (cPanel Setup Node.js App).  
- **Same live DB: not feasible** until Railway MySQL is publicly proxied (or DB migrated off private network).  
- Natro-local MySQL: technically runs, but **not** the live `7fxfin` traders DB → wrong for production CRM.

**(b) Static CRM frontend on Natro → `7fx.customer.org.tr/api/admin`**  
- Feasible for UI assets only; needs CORS + credentialed cookies (`Domain=.customer.org.tr`) or token auth, and CRM routes must allow cross-origin. Session cookie today is host-scoped to the app origin — **non-trivial auth work**, XSS/CSRF surface larger. Not “host CRM directly” in one process.

**(c) Not feasible as “full CRM on Natro, no proxy, same DB”**  
- **Blocker:** Railway MySQL private-only; Natro cannot open `mysql.railway.internal` or public `:3306`.  
- User rejected redirect/proxy; without proxy **or** public DB **or** full stack migrate to Natro MySQL, direct CRM hosting cannot share live data.

**Practical paths if user revisits later:** (1) Railway MySQL TCP proxy + Natro Node app; (2) keep CRM on Railway custom domain / existing PHP edge (proxy — rejected); (3) migrate entire 7FX+DB to Natro MySQL (large).

**This investigation did not deploy anything to Natro or change Railway.**
