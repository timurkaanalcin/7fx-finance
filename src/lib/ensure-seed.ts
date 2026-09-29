import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { ensureTradingSettings } from "./trading-settings";
import { ensureSystemSettings } from "./system-settings";

const DEMO_EMAIL = "trader@deskflow.local";
const DEMO_PASSWORD = "Trade123!";
const ADMIN_EMAIL = "admin@7fx.local";
const ADMIN_PASSWORD = "Admin123!";

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
        name: "İstanbul A",
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
        label: "TRY Banka Havalesi (Demo)",
        active: true,
        bankName: "Demo Bank A.Ş.",
        accountHolder: "7FX Demo Ltd.",
        iban: "TR00 0000 0000 0000 0000 0000 00",
        instructions:
          "Açıklama alanına kullanıcı e-postanızı yazın. Bildirim gönderdikten sonra admin onayı bekleyin.",
        sortOrder: 1,
      },
      {
        type: "CRYPTO",
        label: "USDT (TRC20) Demo",
        active: true,
        asset: "USDT",
        network: "TRC20",
        address: "TDemoWalletAddress7FXFinanceXXXXXXXX",
        instructions: "Sadece USDT-TRC20 gönderin. Yanlış ağda gönderilen fonlar kurtarılamaz.",
        sortOrder: 2,
      },
    ],
  });
  console.log("[7fx] Seeded example deposit methods");
}

async function ensureAdminUser() {
  const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
  if (existing) {
    if (existing.role !== "ADMIN") {
      await prisma.user.update({ where: { id: existing.id }, data: { role: "ADMIN" } });
    }
    return;
  }
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await prisma.user.create({
    data: {
      email: ADMIN_EMAIL,
      passwordHash,
      name: "7FX Admin",
      role: "ADMIN",
      firstName: "7FX",
      lastName: "Admin",
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
  console.log("[7fx] Seeded admin user:", ADMIN_EMAIL);
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
    desk: "İstanbul A",
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
    note: "VIP müşteri — yüksek hacim",
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
    note: "Belgeler bekleniyor",
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
    note: "İlk arama yapıldı",
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
    desk: "İstanbul B",
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
    note: "Hesap donduruldu — risk",
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
    const user = await prisma.user.create({
      data: {
        email: m.email,
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
      { type: "CALL", title: "İlk arama", description: "Müşteri ile tanışma araması yapıldı. Yatırım ilgisi yüksek." },
      { type: "CHAT", title: "Platform yardımı", description: "Terminal giriş ve emir girişi konusunda destek verildi." },
      { type: "NOTE", title: "Takip notu", description: "Belgeler bekleniyor — 48 saat içinde hatırlat." },
      { type: "CALL", title: "FTD takip", description: "İlk yatırım sonrası memnuniyet araması." },
      { type: "CHAT", title: "Marjin sorusu", description: "Kaldıraç ve marjin seviyesi açıklandı." },
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
      { name: "Kimlik Ön Yüz", docType: "ID", status: "APPROVED" },
      { name: "Kimlik Arka Yüz", docType: "ID", status: "PENDING" },
      { name: "İkametgah", docType: "ADDRESS", status: "PENDING" },
      { name: "Selfie + Kimlik", docType: "SELFIE", status: "REJECTED", note: "Fotoğraf bulanık" },
      { name: "Pasaport", docType: "ID", status: "APPROVED" },
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
      { body: "Elena — belge hatırlatması", hours: 4, color: "#f59e0b" },
      { body: "Mehmet — VIP haftalık check-in", hours: 28, color: "#3b82f6" },
      { body: "Ahmed — ilk yatırım teklifi", hours: 52, color: "#10b981" },
      { body: "Desk toplantısı — retention", hours: 76, color: "#8b5cf6" },
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
          name: "Hoş geldiniz",
          subject: "7FX hesabınız hazır",
          body: "Merhaba {{name}},\n\n7FX trading hesabınız oluşturuldu. Terminal: /trade\n\nİyi işlemler.",
          deskName: "HQ",
        },
        {
          name: "Belge talebi",
          subject: "KYC belgeleriniz eksik",
          body: "Merhaba {{name}},\n\nHesap doğrulaması için kimlik ve ikametgah belgenizi yüklemenizi rica ederiz.",
          deskName: "İstanbul A",
        },
        {
          name: "Yatırım onayı",
          subject: "Yatırımınız onaylandı",
          body: "Merhaba {{name}},\n\nYatırım talebiniz onaylandı ve bakiyenize yansıtıldı.",
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
export function ensureDemoSeed(): Promise<void> {
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return Promise.resolve();
  }

  if (!seedPromise) {
    seedPromise = (async () => {
      try {
        const count = await prisma.user.count();
        if (count === 0) {
          const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
          await prisma.user.create({
            data: {
              email: DEMO_EMAIL,
              passwordHash,
              name: "Demo Trader",
              role: "TRADER",
              firstName: "Demo",
              lastName: "Trader",
              phone: "+90 532 000 0001",
              country: "TR",
              address: "Levent, İstanbul",
              accountType: "STANDARD",
              desk: "İstanbul A",
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
              language: "tr",
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
        await ensureDepositMethods();
        await ensureTradingSettings();
        await ensureSystemSettings();
        await ensureDesks();
        await ensureCrmDemoMembers();
        await ensureCrmModuleData();
      } catch (err) {
        seedPromise = null;
        console.error("[7fx] Auto-seed failed:", err);
      }
    })();
  }
  return seedPromise;
}
