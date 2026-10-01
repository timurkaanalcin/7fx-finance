/**
 * Delete known audit/test users from production DB.
 * Run: DATABASE_URL=... node scripts/delete-audit-test-users.mjs
 * Does not print passwords.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PATTERNS = [
  /^audit[.+@]/i,
  /^test[.+@]/i,
  /@test\./i,
  /@example\./i,
  /@mailinator\./i,
  /^e2e[.+@]/i,
  /audit-user/i,
  / pentest/i,
];

const EXACT = [
  "trader@deskflow.local",
  "mehmet.yilmaz@demo.7fx",
  "elena.petrova@demo.7fx",
  "ahmed.hassan@demo.7fx",
  "frozen.user@demo.7fx",
];

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true },
  });
  const targets = users.filter((u) => {
    if (u.role === "ADMIN") return false;
    if (EXACT.includes(u.email)) return true;
    return PATTERNS.some((re) => re.test(u.email));
  });
  console.log(`Found ${targets.length} audit/demo candidates (admins kept).`);
  for (const u of targets) {
    await prisma.order.deleteMany({ where: { userId: u.id } });
    await prisma.position.deleteMany({ where: { userId: u.id } });
    await prisma.account.deleteMany({ where: { userId: u.id } }).catch(() => {});
    await prisma.user.delete({ where: { id: u.id } });
    console.log("deleted", u.email);
  }
  console.log("done");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
