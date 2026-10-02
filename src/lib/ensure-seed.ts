import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { ensureTradingSettings } from "./trading-settings";
import { ensureSystemSettings } from "./system-settings";
import {
  allocateUniqueAccountLoginId,
  backfillMissingAccountLoginIds,
} from "./account-login-id";

const DEMO_EMAIL = "trader@deskflow.local";
const DEMO_PASSWORD = "Trade123!";
/** Dev-only defaults — never used for auto-seed admin in production. */
const DEV_ADMIN_EMAIL = "admin@7fx.local";
const DEV_ADMIN_PASSWORD = "Admin123!";

function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production";
}

function resolveAdminSeedCreds(): { email: string; password: string; source: "env" | "dev" } | null {
  const email = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = String(process.env.ADMIN_PASSWORD || "");
  if (email && password.length >= 8) {
    return { email, password, source: "env" };
  }
  if (!isProductionRuntime()) {
    return { email: DEV_ADMIN_EMAIL, password: DEV_ADMIN_PASSWORD, source: "dev" };
  }
  // Production without ADMIN_EMAIL/ADMIN_PASSWORD: do not create known-default admin.
  return null;
}

let seedPromise: Promise<void> | null = null;

type CrmSeed = {
  email: string;
  password: string;
  name: string;
  firstName: string;
  lastName: string;
  phone?: string;
  country?: string;
  address?: string;
  accountType?: string;
  desk?: string;
  deskId?: string;
  campaign?: string;
  affiliateA?: string;
  affiliateB?: string;
  affiliateC?: string;
  retentionStatus?: string;
  saleStatus?: string;
  potentialStatus?: string;
  validationStatus?: string;
  ftd?: boolean;
  brokerName?: string;
  assigneeName?: string;
  tradingServer?: string;
  tradingGroup?: string;
  language?: string;
  timezone?: string;
  isResident?: boolean;
  registrationCountry?: string;
  documentsStatus?: string;
  balance: number;
  credit?: number;
  bonus?: number;
  active?: boolean;
  note?: string;
};


async function ensureDesks() {
  const count = await prisma.desk.count();
  if (count > 0) return;
  await prisma.desk.createMany({
    data: [
      {
        id: "desk-ist-a",
        name: "Istanbul A",
        code: "DESK-IST-A",
        office: "TR",
        tradePlatformLink: "/trade",
        defaultEmail: "desk.ist@7fx.local",
      },
      {
        id: "desk-hq",
        name: "HQ",
        code: "DESK-HQ",
        office: "TR",
        tradePlatformLink: "/trade",
        defaultEmail: "admin@7fx.local",
      },
      {
        id: "desk-eu-1",
        name: "EU Retention 1",
        code: "DESK-EU-1",
        office: "EU",
        tradePlatformLink: "/trade",
      },
      {
        id: "desk-mena",
        name: "MENA Sales",
        code: "DESK-MENA",
        office: "AE",
        tradePlatformLink: "/trade",
      },
    ],
  });
  console.log("[7fx] Seeded desks");
}

async function ensureDepositMethods() {
  const count = await prisma.depositMethod.count();
  if (count > 0) return;

  await prisma.depositMethod.createMany({
    data: [
      {
        type: "IBAN",
        label: "TRY Bank Transfer (Demo)",
        active: true,
        bankName: "Demo Bank Inc.",
        accountHolder: "7FX Demo Ltd.",
        iban: "TR00 0000 0000 0000 0000 0000 00",
        instructions:
          "Enter your user email in the description field. After sending the notification, wait for admin approval.",
        sortOrder: 1,
      },
      {
        type: "CRYPTO",
        label: "USDT (TRC20) Demo",
        active: true,
        asset: "USDT",
        network: "TRC20",
        address: "TDemoWalletAddress7FXFinanceXXXXXXXX",
        instructions: "Send USDT-TRC20 only. Funds sent on the wrong network cannot be recovered.",
        sortOrder: 2,
      },
    ],
  });
  console.log("[7fx] Seeded example deposit methods");
}


/** Named CRM admin — asenaerdem (password set explicitly per ops request). */
async function ensureAsenaAdmin() {
  const email = "asenaerdem@7fx.local";
  const password = "1925";
  const name = "asenaerdem";
  const existing = await prisma.user.findUnique({ where: { email } });
  const passwordHash = await bcrypt.hash(password, 10);
  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        role: "ADMIN",
        active: true,
        name,
        firstName: "Asena",
        lastName: "Erdem",
        passwordHash,
      },
    });
    console.log("[7fx] Ensured ADMIN asenaerdem (password refreshed)");
    return;
  }
  const accountLoginId = await allocateUniqueAccountLoginId();
  await prisma.user.create({
    data: {
      email,
      accountLoginId,
      passwordHash,
      name,
      role: "ADMIN",
      active: true,
      firstName: "Asena",
      lastName: "Erdem",
      language: "tr",
      timezone: "Europe/Istanbul",
      country: "TR",
      accountType: "PRO",
      desk: "HQ",
      deskId: "DESK-HQ",
      documentsStatus: "APPROVED",
      registrationDate: new Date(),
      account: {
        create: {
          balance: 0,
          equity: 0,
          margin: 0,
          freeMargin: 0,
          leverage: 100,
          currency: "USD",
          credit: 0,
          bonus: 0,
        },
      },
    },
  });
  console.log("[7fx] Seeded ADMIN asenaerdem@7fx.local");
}

async function ensureAdminUser() {
  const creds = resolveAdminSeedCreds();
  if (!creds) {
    console.warn(
      "[7fx] Skipping auto-seed admin: set ADMIN_EMAIL and ADMIN_PASSWORD (min 8 chars) in production env."
    );
    return;
  }

  // Disable legacy known-default admin in production if env admin is configured separately.
  if (isProductionRuntime() && creds.source === "env") {
    const legacy = await prisma.user.findUnique({ where: { email: DEV_ADMIN_EMAIL } });
    if (legacy && legacy.email !== creds.email) {
      const looksLikeDefault =
        (await bcrypt.compare(DEV_ADMIN_PASSWORD, legacy.passwordHash)) === true;
      if (looksLikeDefault) {
        await prisma.user.update({
          where: { id: legacy.id },
          data: { active: false, role: "TRADER" },
        });
        console.log("[7fx] Disabled legacy default admin account in production");
      }
    }
  }

  const existing = await prisma.user.findUnique({ where: { email: creds.email } });
  if (existing) {
    // Always keep the configured env/dev admin unfrozen + ADMIN.
    // Previously only ADMIN_ROTATE_PASSWORD=1 restored active:true, so a freeze
    // (or accidental seed) left prod admin stuck on "Account frozen".
    const patch: { role: string; active: boolean; passwordHash?: string } = {
      role: "ADMIN",
      active: true,
    };
    let rotated = false;
    if (creds.source === "env" && process.env.ADMIN_ROTATE_PASSWORD === "1") {
      patch.passwordHash = await bcrypt.hash(creds.password, 10);
      rotated = true;
    }
    const needsPatch =
      existing.role !== "ADMIN" ||
      existing.active === false ||
      rotated;
    if (needsPatch) {
      await prisma.user.update({ where: { id: existing.id }, data: patch });
      if (rotated) {
        console.log("[7fx] Rotated admin password from env for", creds.email);
      } else if (existing.active === false) {
        console.log("[7fx] Re-activated frozen seed admin", creds.email);
      }
    }
    return;
  }
  const passwordHash = await bcrypt.hash(creds.password, 10);
  const accountLoginId = await allocateUniqueAccountLoginId();
  await prisma.user.create({
    data: {
      email: creds.email,
      accountLoginId,
      passwordHash,
      name: "7FX Admin",
      role: "ADMIN",
      firstName: "7FX",
      lastName: "Admin",
      language: "en",
      timezone: "Europe/Istanbul",
      country: "TR",
      accountType: "PRO",
      desk: "HQ",
      deskId: "DESK-HQ",
      documentsStatus: "APPROVED",
      registrationDate: new Date(),
      account: {
        create: {
          balance: 0,
          equity: 0,
          margin: 0,
          freeMargin: 0,
          leverage: 100,
          currency: "USD",
          credit: 0,
          bonus: 0,
        },
      },
    },
  });
  console.log("[7fx] Seeded admin user via", creds.source + ":", creds.email);
}

const EXTRA_MEMBERS: CrmSeed[] = [
  {
    email: "mehmet.yilmaz@demo.7fx",
    password: "Demo123!",
    name: "Mehmet Yılmaz",
    firstName: "Mehmet",
    lastName: "Yılmaz",
    phone: "+90 533 111 2233",
    country: "TR",
    address: "Kadıköy, İstanbul",
    accountType: "VIP",
    desk: "Istanbul A",
    deskId: "DESK-IST-A",
    campaign: "facebook_ads",
    affiliateA: "AFF-100",
    retentionStatus: "ACTIVE",
    saleStatus: "DEPOSITED",
    potentialStatus: "HIGH",
    validationStatus: "VERIFIED",
    ftd: true,
    brokerName: "Ayşe Kaya",
    assigneeName: "Ayşe Kaya",
    tradingServer: "7FX-Live-01",
    tradingGroup: "VIP-USD",
    isResident: true,
    registrationCountry: "TR",
    documentsStatus: "APPROVED",
    balance: 25000,
    credit: 500,
    bonus: 250,
    note: "VIP client — high volume",
  },
  {
    email: "elena.petrova@demo.7fx",
    password: "Demo123!",
    name: "Elena Petrova",
    firstName: "Elena",
    lastName: "Petrova",
    phone: "+7 900 123 4567",
    country: "RU",
    address: "Moscow",
    accountType: "STANDARD",
    desk: "EU Desk",
    deskId: "DESK-EU-1",
    campaign: "google_search",
    affiliateA: "AFF-200",
    affiliateB: "BID-44",
    retentionStatus: "AT_RISK",
    saleStatus: "CONTACTED",
    potentialStatus: "HOT",
    validationStatus: "PENDING",
    ftd: false,
    brokerName: "Can Demir",
    assigneeName: "Can Demir",
    tradingServer: "7FX-Live-02",
    tradingGroup: "STD-USD",
    language: "en",
    timezone: "Europe/Moscow",
    isResident: false,
    registrationCountry: "RU",
    documentsStatus: "PENDING",
    balance: 1500,
    note: "Documents pending",
  },
  {
    email: "ahmed.hassan@demo.7fx",
    password: "Demo123!",
    name: "Ahmed Hassan",
    firstName: "Ahmed",
    lastName: "Hassan",
    phone: "+971 50 123 4567",
    country: "AE",
    address: "Dubai Marina",
    accountType: "PRO",
    desk: "MENA",
    deskId: "DESK-MENA",
    campaign: "influencer",
    affiliateC: "CID-77",
    retentionStatus: "ACTIVE",
    saleStatus: "INTERESTED",
    potentialStatus: "MEDIUM",
    validationStatus: "UNVERIFIED",
    ftd: false,
    brokerName: "Selin Arslan",
    assigneeName: "Selin Arslan",
    tradingServer: "7FX-Live-01",
    tradingGroup: "PRO-USD",
    language: "en",
    timezone: "Asia/Dubai",
    registrationCountry: "AE",
    documentsStatus: "NONE",
    balance: 5000,
    bonus: 100,
    note: "First call completed",
  },
  {
    email: "frozen.user@demo.7fx",
    password: "Demo123!",
    name: "Frozen User",
    firstName: "Frozen",
    lastName: "User",
    phone: "+90 555 999 0000",
    country: "TR",
    accountType: "STANDARD",
    desk: "Istanbul B",
    deskId: "DESK-IST-B",
    retentionStatus: "CHURNED",
    saleStatus: "LOST",
    potentialStatus: "LOW",
    validationStatus: "REJECTED",
    ftd: true,
    brokerName: "Can Demir",
    documentsStatus: "REJECTED",
    balance: 50,
    active: false,
    note: "Account frozen — risk",
  },
];

async function ensureCrmDemoMembers() {
  for (const m of EXTRA_MEMBERS) {
    const existing = await prisma.user.findUnique({ where: { email: m.email } });
    if (existing) continue;
    const passwordHash = await bcrypt.hash(m.password, 10);
    const bal = m.balance;
    const credit = m.credit ?? 0;
    const bonus = m.bonus ?? 0;
    const accountLoginId = await allocateUniqueAccountLoginId();
    const user = await prisma.user.create({
      data: {
        email: m.email,
        accountLoginId,
        passwordHash,
        name: m.name,
        role: "TRADER",
        active: m.active !== false,
        firstName: m.firstName,
        lastName: m.lastName,
        phone: m.phone ?? null,
        country: m.country ?? null,
        address: m.address ?? null,
        accountType: m.accountType ?? "STANDARD",
        desk: m.desk ?? null,
        deskId: m.deskId ?? null,
        campaign: m.campaign ?? null,
        affiliateA: m.affiliateA ?? null,
        affiliateB: m.affiliateB ?? null,
        affiliateC: m.affiliateC ?? null,
        retentionStatus: m.retentionStatus ?? null,
        saleStatus: m.saleStatus ?? null,
        potentialStatus: m.potentialStatus ?? null,
        validationStatus: m.validationStatus ?? null,
        ftd: Boolean(m.ftd),
        brokerName: m.brokerName ?? null,
        assigneeName: m.assigneeName ?? null,
        tradingServer: m.tradingServer ?? null,
        tradingGroup: m.tradingGroup ?? null,
        language: m.language ?? "tr",
        timezone: m.timezone ?? "Europe/Istanbul",
        isResident: Boolean(m.isResident),
        registrationCountry: m.registrationCountry ?? null,
        documentsStatus: m.documentsStatus ?? "NONE",
        registrationDate: new Date(),
        account: {
          create: {
            balance: bal,
            equity: bal,
            freeMargin: bal,
            currency: "USD",
            credit,
            bonus,
          },
        },
        notes: m.note
          ? {
              create: { authorName: "Seed", body: m.note },
            }
          : undefined,
      },
    });
    console.log("[7fx] Seeded CRM demo member:", user.email);
  }
}


async function ensureCrmModuleData() {
  const traders = await prisma.user.findMany({
    where: { role: "TRADER" },
    take: 10,
    orderBy: { createdAt: "asc" },
  });
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  const workerName = admin?.name || "7FX Admin";
  const workerId = admin?.id || null;

  if ((await prisma.communication.count()) === 0 && traders.length) {
    const samples = [
      { type: "CALL", title: "First call", description: "Introductory call completed. High investment interest." },
      { type: "CHAT", title: "Platform help", description: "Support provided on terminal login and order entry." },
      { type: "NOTE", title: "Takip notu", description: "Documents pending — remind within 48 hours." },
      { type: "CALL", title: "FTD takip", description: "Satisfaction call after first deposit." },
      { type: "CHAT", title: "Margin sorusu", description: "Leverage and margin level explained." },
    ];
    for (let i = 0; i < samples.length; i++) {
      const t = traders[i % traders.length];
      await prisma.communication.create({
        data: {
          userId: t.id,
          type: samples[i].type,
          title: samples[i].title,
          description: samples[i].description,
          workerName,
          workerId,
        },
      });
    }
    console.log("[7fx] Seeded communications");
  }

  if ((await prisma.documentRecord.count()) === 0 && traders.length) {
    const docs = [
      { name: "ID Front", docType: "ID", status: "APPROVED" },
      { name: "ID Back", docType: "ID", status: "PENDING" },
      { name: "Proof of address", docType: "ADDRESS", status: "PENDING" },
      { name: "Selfie + ID", docType: "SELFIE", status: "REJECTED", note: "Photo blurry" },
      { name: "Passport", docType: "ID", status: "APPROVED" },
    ];
    for (let i = 0; i < docs.length; i++) {
      const t = traders[i % traders.length];
      await prisma.documentRecord.create({
        data: {
          userId: t.id,
          name: docs[i].name,
          docType: docs[i].docType,
          status: docs[i].status,
          note: docs[i].note ?? null,
          reviewedAt: docs[i].status !== "PENDING" ? new Date() : null,
        },
      });
    }
    console.log("[7fx] Seeded document records");
  }

  if ((await prisma.reminder.count()) === 0 && traders.length) {
    const now = Date.now();
    const reminders = [
      { body: "Elena — document reminder", hours: 4, color: "#f59e0b" },
      { body: "Mehmet — VIP weekly check-in", hours: 28, color: "#3b82f6" },
      { body: "Ahmed — first deposit offer", hours: 52, color: "#10b981" },
      { body: "Desk meeting — retention", hours: 76, color: "#8b5cf6" },
    ];
    for (let i = 0; i < reminders.length; i++) {
      const t = traders[i % traders.length];
      await prisma.reminder.create({
        data: {
          userId: t.id,
          workerId,
          workerName,
          body: reminders[i].body,
          remindAt: new Date(now + reminders[i].hours * 3600_000),
          color: reminders[i].color,
        },
      });
    }
    console.log("[7fx] Seeded reminders");
  }

  if ((await prisma.mailTemplate.count()) === 0) {
    await prisma.mailTemplate.createMany({
      data: [
        {
          name: "Welcome",
          subject: "Your 7FX account is ready",
          body: "Hello {{name}},\n\nYour 7FX trading account was created. Terminal: /trade\n\nHappy trading.",
          deskName: "HQ",
        },
        {
          name: "Belge talebi",
          subject: "KYC belgeleriniz eksik",
          body: "Hello {{name}},\n\nPlease upload your ID and proof of address for account verification.",
          deskName: "Istanbul A",
        },
        {
          name: "Deposit approval",
          subject: "Your deposit was approved",
          body: "Hello {{name}},\n\nYour deposit request was approved and credited to your balance.",
          deskName: "HQ",
        },
      ],
    });
    console.log("[7fx] Seeded mail templates");
  }
}


/**
 * First-request auto-seed: demo trader, admin, deposit methods, CRM members.
 * Safe to call on every request — runs at most once per cold start.
 */

/** Ensure Nejat Yücel has one CLOSED position with +102 USD realized PnL (idempotent). */
async function ensureNejatClosedTrade() {
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: "n.yucel@hotmail.com" },
        { name: { contains: "Nejat" } },
        { AND: [{ firstName: "Nejat" }, { lastName: { contains: "cel" } }] },
      ],
    },
  });
  if (!user) {
    console.log("[7fx] Nejat Yücel not found — skip closed +102 trade ensure");
    return;
  }
  const existing = await prisma.position.findFirst({
    where: {
      userId: user.id,
      status: "CLOSED",
      OR: [{ closeProfit: 102 }, { profit: 102 }],
    },
  });
  if (existing) {
    if (existing.closeProfit !== 102 || existing.profit !== 102) {
      await prisma.position.update({
        where: { id: existing.id },
        data: { closeProfit: 102, profit: 102, status: "CLOSED" },
      });
    }
    return;
  }
  const openedAt = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  const closedAt = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
  await prisma.position.create({
    data: {
      userId: user.id,
      symbol: "EURUSD",
      side: "BUY",
      volume: 0.1,
      openPrice: 1.085,
      currentPrice: 1.0952,
      profit: 102,
      margin: 108.5,
      status: "CLOSED",
      openedAt,
      closedAt,
      closePrice: 1.0952,
      closeProfit: 102,
    },
  });
  console.log("[7fx] Ensured Nejat Yücel CLOSED EURUSD +102 USD trade");
}

export function ensureDemoSeed(): Promise<void> {
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return Promise.resolve();
  }

  if (!seedPromise) {
    seedPromise = (async () => {
      try {
        const allowDemoSeed =
          !isProductionRuntime() || process.env.ALLOW_DEMO_SEED === "1";
        const count = await prisma.user.count();
        if (allowDemoSeed && count === 0) {
          const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
          const accountLoginId = await allocateUniqueAccountLoginId();
          await prisma.user.create({
            data: {
              email: DEMO_EMAIL,
              accountLoginId,
              passwordHash,
              name: "Demo Trader",
              role: "TRADER",
              firstName: "Demo",
              lastName: "Trader",
              phone: "+90 532 000 0001",
              country: "TR",
              address: "Levent, İstanbul",
              accountType: "STANDARD",
              desk: "Istanbul A",
              deskId: "DESK-IST-A",
              campaign: "organic",
              retentionStatus: "ACTIVE",
              saleStatus: "DEPOSITED",
              potentialStatus: "MEDIUM",
              validationStatus: "VERIFIED",
              ftd: true,
              brokerName: "Ayşe Kaya",
              assigneeName: "Ayşe Kaya",
              tradingServer: "7FX-Live-01",
              tradingGroup: "STD-USD",
              language: "en",
              timezone: "Europe/Istanbul",
              isResident: true,
              registrationCountry: "TR",
              documentsStatus: "APPROVED",
              registrationDate: new Date(),
              account: {
                create: {
                  balance: 10000,
                  equity: 10000,
                  margin: 0,
                  freeMargin: 10000,
                  leverage: 100,
                  currency: "USD",
                  credit: 0,
                  bonus: 0,
                },
              },
            },
          });
          console.log("[7fx] Auto-seeded demo user:", DEMO_EMAIL);
        }
        await ensureAdminUser();
  await ensureAsenaAdmin();
        await ensureDepositMethods();
        await ensureTradingSettings();
        await ensureSystemSettings();
        await ensureDesks();
        if (allowDemoSeed) {
          await ensureCrmDemoMembers();
          await ensureCrmModuleData();
        }
        await backfillMissingAccountLoginIds();
        await ensureNejatClosedTrade();
      } catch (err) {
        seedPromise = null;
        console.error("[7fx] Auto-seed failed:", err);
      }
    })();
  }
  return seedPromise;
}
