import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomInt } from "crypto";

const prisma = new PrismaClient();

function generateAccountLoginId(): string {
  let id = String(randomInt(1, 10));
  for (let i = 0; i < 15; i++) id += String(randomInt(0, 10));
  return id;
}

async function allocateUniqueAccountLoginId(): Promise<string> {
  for (let i = 0; i < 24; i++) {
    const candidate = generateAccountLoginId();
    const existing = await prisma.user.findUnique({
      where: { accountLoginId: candidate },
      select: { id: true },
    });
    if (!existing) return candidate;
  }
  throw new Error("ACCOUNT_LOGIN_ID_ALLOC_FAILED");
}

type DemoMember = {
  email: string;
  password: string;
  name: string;
  role?: "TRADER" | "ADMIN";
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
  balance?: number;
  credit?: number;
  bonus?: number;
  currency?: string;
  active?: boolean;
  note?: string;
};

const DEMO_MEMBERS: DemoMember[] = [
  {
    email: "trader@deskflow.local",
    password: "Trade123!",
    name: "Demo Trader",
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
    balance: 0,
    note: "Main demo trader account",
  },
  {
    email: "admin@7fx.local",
    password: "Admin123!",
    name: "7FX Admin",
    role: "ADMIN",
    firstName: "7FX",
    lastName: "Admin",
    phone: "+90 212 000 0000",
    country: "TR",
    accountType: "PRO",
    desk: "HQ",
    deskId: "DESK-HQ",
    retentionStatus: "VIP",
    saleStatus: "DEPOSITED",
    validationStatus: "VERIFIED",
    brokerName: "System",
    language: "en",
    timezone: "Europe/Istanbul",
    isResident: true,
    registrationCountry: "TR",
    documentsStatus: "APPROVED",
    balance: 0,
  },
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
    credit: 0,
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

async function upsertMember(m: DemoMember) {
  const passwordHash = await bcrypt.hash(m.password, 10);
  const role = m.role || "TRADER";
  const bal = m.balance ?? 0;
  const credit = m.credit ?? 0;
  const bonus = m.bonus ?? 0;
  const currency = m.currency || "USD";

  const user = await prisma.user.upsert({
    where: { email: m.email },
    update: {
      passwordHash,
      name: m.name,
      role,
      active: m.active !== false,
      firstName: m.firstName,
      lastName: m.lastName,
      phone: m.phone || null,
      country: m.country || null,
      address: m.address || null,
      accountType: m.accountType || "STANDARD",
      desk: m.desk || null,
      deskId: m.deskId || null,
      campaign: m.campaign || null,
      affiliateA: m.affiliateA || null,
      affiliateB: m.affiliateB || null,
      affiliateC: m.affiliateC || null,
      retentionStatus: m.retentionStatus || null,
      saleStatus: m.saleStatus || null,
      potentialStatus: m.potentialStatus || null,
      validationStatus: m.validationStatus || null,
      ftd: Boolean(m.ftd),
      brokerName: m.brokerName || null,
      assigneeName: m.assigneeName || null,
      tradingServer: m.tradingServer || null,
      tradingGroup: m.tradingGroup || null,
      language: m.language || "tr",
      timezone: m.timezone || "Europe/Istanbul",
      isResident: Boolean(m.isResident),
      registrationCountry: m.registrationCountry || null,
      documentsStatus: m.documentsStatus || "NONE",
      registrationDate: new Date(),
    },
    create: {
      email: m.email,
      accountLoginId: await allocateUniqueAccountLoginId(),
      passwordHash,
      name: m.name,
      role,
      active: m.active !== false,
      firstName: m.firstName,
      lastName: m.lastName,
      phone: m.phone || null,
      country: m.country || null,
      address: m.address || null,
      accountType: m.accountType || "STANDARD",
      desk: m.desk || null,
      deskId: m.deskId || null,
      campaign: m.campaign || null,
      affiliateA: m.affiliateA || null,
      affiliateB: m.affiliateB || null,
      affiliateC: m.affiliateC || null,
      retentionStatus: m.retentionStatus || null,
      saleStatus: m.saleStatus || null,
      potentialStatus: m.potentialStatus || null,
      validationStatus: m.validationStatus || null,
      ftd: Boolean(m.ftd),
      brokerName: m.brokerName || null,
      assigneeName: m.assigneeName || null,
      tradingServer: m.tradingServer || null,
      tradingGroup: m.tradingGroup || null,
      language: m.language || "tr",
      timezone: m.timezone || "Europe/Istanbul",
      isResident: Boolean(m.isResident),
      registrationCountry: m.registrationCountry || null,
      documentsStatus: m.documentsStatus || "NONE",
      registrationDate: new Date(),
      account: {
        create: {
          balance: bal,
          equity: bal,
          margin: 0,
          freeMargin: bal,
          leverage: 100,
          currency,
          credit,
          bonus,
        },
      },
    },
  });

  await prisma.account.upsert({
    where: { userId: user.id },
    update: { credit, bonus, currency },
    create: {
      userId: user.id,
      balance: bal,
      equity: bal,
      freeMargin: bal,
      currency,
      credit,
      bonus,
    },
  });

  if (m.note) {
    const existing = await prisma.userNote.count({ where: { userId: user.id } });
    if (existing === 0) {
      await prisma.userNote.create({
        data: {
          userId: user.id,
          authorName: "Seed",
          body: m.note,
        },
      });
    }
  }

  console.log(`Member: ${user.email} (${role}) desk=${m.desk || "—"}`);
}

async function main() {
  const deskCount = await prisma.desk.count();
  if (deskCount === 0) {
    await prisma.desk.createMany({
      data: [
        { id: "desk-ist-a", name: "Istanbul A", code: "DESK-IST-A", office: "TR", tradePlatformLink: "/trade" },
        { id: "desk-hq", name: "HQ", code: "DESK-HQ", office: "TR", tradePlatformLink: "/trade" },
        { id: "desk-eu-1", name: "EU Retention 1", code: "DESK-EU-1", office: "EU", tradePlatformLink: "/trade" },
        { id: "desk-mena", name: "MENA Sales", code: "DESK-MENA", office: "AE", tradePlatformLink: "/trade" },
      ],
    });
    console.log("Seeded desks");
  }

  await prisma.systemSettings.upsert({
    where: { id: "default" },
    update: { referralCode: "213950812", referralRequired: true },
    create: { id: "default", referralCode: "213950812", referralRequired: true },
  });
  console.log("Ensured SystemSettings referral code 213950812");

  for (const m of DEMO_MEMBERS) {
    await upsertMember(m);
  }

  const methodCount = await prisma.depositMethod.count();
  if (methodCount === 0) {
    await prisma.depositMethod.createMany({
      data: [
        {
          type: "IBAN",
          label: "TRY Bank Transfer (Demo)",
          active: true,
          bankName: "Demo Bank Inc.",
          accountHolder: "7FX Demo Ltd.",
          iban: "TR00 0000 0000 0000 0000 0000 00",
          instructions: "Enter your user email in the description field.",
          sortOrder: 1,
        },
        {
          type: "CRYPTO",
          label: "USDT (TRC20) Demo",
          active: true,
          asset: "USDT",
          network: "TRC20",
          address: "TDemoWalletAddress7FXFinanceXXXXXXXX",
          instructions: "Send USDT-TRC20 only.",
          sortOrder: 2,
        },
      ],
    });
    console.log("Seeded deposit methods");
  }

  // Backfill account login ID for any users still missing it
  const missingIds = await prisma.user.findMany({
    where: { OR: [{ accountLoginId: null }, { accountLoginId: "" }] },
    select: { id: true },
  });
  for (const row of missingIds) {
    await prisma.user.update({
      where: { id: row.id },
      data: { accountLoginId: await allocateUniqueAccountLoginId() },
    });
  }
  if (missingIds.length) {
    console.log(`Backfilled accountLoginId for ${missingIds.length} user(s)`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
