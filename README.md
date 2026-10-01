# 7FX

Dark fintech landing + demo trading terminal (forked from M1 Finance demo codebase; marketing brand is **7FX**).

> Independent demo product. Trade/admin UI remains the M1 terminal shell; only the landing page is rebranded to 7FX.

## Stack
- Next.js 14, Prisma, Railway

## Brand
- **7FX** landing (logo, mark, hero video, dark fintech theme)
- `/trade` and `/admin` keep the M1-style UI unchanged

## Seed
- Admin: set via env `ADMIN_EMAIL` / `ADMIN_PASSWORD` in production (dev-only default exists locally; never auto-seeded in prod without env).
